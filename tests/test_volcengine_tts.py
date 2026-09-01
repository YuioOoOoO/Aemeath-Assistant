import asyncio
import json
import struct
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from open_llm_vtuber.conversations.tts_manager import TTSTaskManager
from open_llm_vtuber.agent.output_types import Actions
from open_llm_vtuber.tts.volcengine_tts import TTSEngine, VolcengineProtocolError
from open_llm_vtuber.live2d_model import Live2dModel


class VolcengineProtocolTests(unittest.TestCase):
    @staticmethod
    def _engine() -> TTSEngine:
        return TTSEngine(
            api_key="test-key",
            resource_id="seed-tts-2.0",
            speaker="test-speaker",
            emotion_scale=3.5,
            emotion_map={"joy": "happy"},
            speech_instruction_map={
                "neutral": {"medium": "用自然轻快的语气说"},
                "joy": {
                    "weak": "轻轻开心地说",
                    "medium": "开心地说",
                    "strong": "非常开心地说",
                },
            },
        )

    def test_request_frame_contains_v3_header_and_json(self) -> None:
        request = {"req_params": {"text": "你好"}}
        frame = TTSEngine._build_request_frame(request)

        self.assertEqual(frame[:4], bytes((0x11, 0x10, 0x10, 0x00)))
        payload_size = struct.unpack_from(">I", frame, 4)[0]
        self.assertEqual(payload_size, len(frame) - 8)
        self.assertEqual(json.loads(frame[8:].decode("utf-8")), request)

    def test_audio_and_session_finished_frames(self) -> None:
        audio_frame = self._event_frame(0x0B, 352, b"audio")
        finished_frame = self._event_frame(0x09, 152, b"{}")

        self.assertEqual(TTSEngine._parse_response_frame(audio_frame), (352, b"audio"))
        self.assertEqual(TTSEngine._parse_response_frame(finished_frame), (152, b"{}"))

    def test_api_error_frame_raises_without_credentials(self) -> None:
        detail = b'{"message":"invalid speaker"}'
        frame = (
            bytes((0x11, 0xF0, 0x10, 0x00))
            + struct.pack(">I", 45000000)
            + struct.pack(">I", len(detail))
            + detail
        )

        with self.assertRaisesRegex(VolcengineProtocolError, "45000000"):
            TTSEngine._parse_response_frame(frame)

    def test_request_includes_mapped_emotion_controls(self) -> None:
        engine = self._engine()
        request = engine._build_request("你好", emotion="happy")
        params = request["req_params"]

        self.assertTrue(params["enable_emotion"])
        self.assertEqual(params["emotion"], "happy")
        self.assertEqual(params["emotion_scale"], 3.5)

    def test_neutral_request_uses_automatic_prosody(self) -> None:
        engine = self._engine()
        params = engine._build_request("你好", emotion="neutral")["req_params"]

        self.assertNotIn("emotion", params)
        self.assertNotIn("emotion_scale", params)

    def test_instruction_is_prefixed_and_replaces_native_emotion_fields(self) -> None:
        engine = self._engine()
        instruction = engine._resolve_speech_instruction("joy", 5)
        params = engine._build_request(
            "你好", emotion="happy", emotion_scale=5, speech_instruction=instruction
        )["req_params"]

        self.assertEqual(params["text"], "[#非常开心地说]你好")
        self.assertNotIn("enable_emotion", params)
        self.assertNotIn("emotion", params)
        self.assertNotIn("emotion_scale", params)

    def test_instruction_strength_uses_existing_three_tiers(self) -> None:
        engine = self._engine()

        self.assertEqual(engine._resolve_speech_instruction("joy", 1), "轻轻开心地说")
        self.assertEqual(engine._resolve_speech_instruction("joy", 3), "开心地说")
        self.assertEqual(engine._resolve_speech_instruction("joy", 5), "非常开心地说")

    def test_missing_emotion_uses_neutral_instruction(self) -> None:
        engine = self._engine()

        self.assertEqual(
            engine._resolve_speech_instruction(None, None), "用自然轻快的语气说"
        )

    def test_segment_intensity_overrides_default_and_is_clamped(self) -> None:
        engine = self._engine()
        strong = engine._build_request("太好了", emotion="happy", emotion_scale=5)
        overflow = engine._build_request("太好了", emotion="happy", emotion_scale=9)

        self.assertEqual(strong["req_params"]["emotion_scale"], 5)
        self.assertEqual(overflow["req_params"]["emotion_scale"], 5.0)

    @staticmethod
    def _event_frame(message_type: int, event: int, payload: bytes) -> bytes:
        session_id = b"session"
        return (
            bytes((0x11, (message_type << 4) | 0x04, 0x10, 0x00))
            + struct.pack(">I", event)
            + struct.pack(">I", len(session_id))
            + session_id
            + struct.pack(">I", len(payload))
            + payload
        )


class TTSTaskManagerCancellationTests(unittest.IsolatedAsyncioTestCase):
    async def test_clear_cancels_generation_tasks(self) -> None:
        manager = TTSTaskManager()
        task = asyncio.create_task(asyncio.sleep(60))
        manager.task_list.append(task)

        manager.clear()
        await asyncio.sleep(0)

        self.assertTrue(task.cancelled())
        self.assertEqual(manager.task_list, [])

    def test_resolve_live2d_expression_to_emotion_key(self) -> None:
        live2d_model = type(
            "FakeLive2DModel", (), {"emo_map": {"neutral": 0, "joy": 4}}
        )()

        result = TTSTaskManager._resolve_emotion(Actions(expressions=[4]), live2d_model)

        self.assertEqual(result, "joy")


class VoiceEmotionSegmentationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.model = Live2dModel("xiaoai")

    def test_multiple_emotion_markers_split_one_sentence(self) -> None:
        segments = self.model.split_emotion_segments(
            "[joy:2]今天真不错，[surprise:5]等等，那是什么？"
        )

        self.assertEqual(
            segments,
            [
                ("今天真不错，", "joy", 2),
                ("等等，那是什么？", "surprise", 5),
            ],
        )

    def test_markers_do_not_remain_in_spoken_text(self) -> None:
        segments = self.model.split_emotion_segments("[sadness]有一点难过。")

        self.assertEqual(segments, [("有一点难过。", "sadness", 3)])
        self.assertNotIn("[", segments[0][0])

    def test_intensity_tier_selects_only_calibrated_candidates(self) -> None:
        expressions, motions = self.model.select_voice_performance("joy", 5)
        tier = self.model.voice_emotion_map["joy"]["strong"]

        self.assertIn(expressions[0], tier["expressions"])
        self.assertIn(motions[0], tier["motions"])

if __name__ == "__main__":
    unittest.main()
