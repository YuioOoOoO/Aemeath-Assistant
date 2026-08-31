import asyncio
import json
import os
import struct
import uuid
from typing import Any

from loguru import logger
from websockets.asyncio.client import connect

from .tts_interface import TTSInterface


class VolcengineProtocolError(RuntimeError):
    """Raised when Volcengine returns an invalid frame or an API error."""


class TTSEngine(TTSInterface):
    """Volcengine Seed-TTS V3 unidirectional streaming client."""

    _DEFAULT_ENDPOINT = (
        "wss://openspeech.bytedance.com/api/v3/tts/unidirectional/stream"
    )
    _EVENT_TTS_RESPONSE = 352
    _EVENT_SESSION_FINISHED = 152

    def __init__(
        self,
        api_key: str,
        resource_id: str,
        speaker: str,
        endpoint: str = _DEFAULT_ENDPOINT,
        sample_rate: int = 24000,
        speech_rate: int = 0,
        loudness_rate: int = 0,
        emotion_enabled: bool = True,
        emotion_scale: float = 3.0,
        emotion_map: dict[str, str] | None = None,
        timeout_seconds: float = 30.0,
    ) -> None:
        self.api_key = api_key
        self.resource_id = resource_id
        self.speaker = speaker
        self.endpoint = endpoint
        self.sample_rate = sample_rate
        self.speech_rate = speech_rate
        self.loudness_rate = loudness_rate
        self.emotion_enabled = emotion_enabled
        self.emotion_scale = emotion_scale
        self.emotion_map = emotion_map or {}
        self.timeout_seconds = timeout_seconds
        self._validate_config()

    def _validate_config(self) -> None:
        missing = [
            name
            for name, value in (
                ("api_key", self.api_key),
                ("resource_id", self.resource_id),
                ("speaker", self.speaker),
            )
            if not value or not value.strip()
        ]
        if missing:
            raise ValueError(
                "Volcengine TTS configuration is missing: " + ", ".join(missing)
            )

    def generate_audio(self, text: str, file_name_no_ext=None) -> str:
        try:
            asyncio.get_running_loop()
        except RuntimeError:
            return asyncio.run(self.async_generate_audio(text, file_name_no_ext))
        raise RuntimeError(
            "generate_audio cannot run inside an event loop; use async_generate_audio"
        )

    async def async_generate_audio_with_emotion(
        self,
        text: str,
        file_name_no_ext=None,
        emotion_key: str | None = None,
        emotion_intensity: int | None = None,
    ) -> str:
        """Generate speech using a Live2D emotion key when configured."""
        emotion = (
            self.emotion_map.get(emotion_key, emotion_key) if emotion_key else None
        )
        # Treat the configured scale as an emotion-strength multiplier while
        # preserving the relative 1-5 intensity selected for each sentence.
        # A scale of 3.0 is neutral (1:1); higher values make emotional speech
        # more expressive without flattening weak/medium/strong distinctions.
        adjusted_intensity = None
        if emotion_intensity is not None:
            adjusted_intensity = 1.0 + (
                (float(emotion_intensity) - 1.0) * (self.emotion_scale / 3.0)
            )
            adjusted_intensity = max(1.0, min(5.0, adjusted_intensity))
        return await self.async_generate_audio(
            text=text,
            file_name_no_ext=file_name_no_ext,
            emotion=emotion,
            emotion_scale=adjusted_intensity,
        )

    async def async_generate_audio(
        self,
        text: str,
        file_name_no_ext=None,
        emotion: str | None = None,
        emotion_scale: float | None = None,
    ) -> str:
        cache_file = self.generate_cache_file_name(
            file_name_no_ext, file_extension="mp3"
        )
        request_id = str(uuid.uuid4())
        headers = {
            "X-Api-Key": self.api_key,
            "X-Api-Resource-Id": self.resource_id,
            "X-Api-Request-Id": request_id,
        }
        request = self._build_request(text, emotion, emotion_scale)

        try:
            return await self._stream_audio(request, headers, cache_file)
        except VolcengineProtocolError:
            self._remove_partial_file(cache_file)
            if emotion:
                logger.warning(
                    "Volcengine rejected emotional synthesis for '{}'; "
                    "retrying without emotion control.",
                    emotion,
                )
                return await self.async_generate_audio(
                    text=text,
                    file_name_no_ext=file_name_no_ext,
                    emotion=None,
                    emotion_scale=None,
                )
            logger.exception("Volcengine TTS generation failed")
            raise
        except asyncio.CancelledError:
            self._remove_partial_file(cache_file)
            logger.info("Volcengine TTS generation cancelled")
            raise
        except Exception:
            self._remove_partial_file(cache_file)
            logger.exception("Volcengine TTS generation failed")
            raise

    def _build_request(
        self,
        text: str,
        emotion: str | None = None,
        emotion_scale: float | None = None,
    ) -> dict[str, Any]:
        req_params: dict[str, Any] = {
            "text": text,
            "speaker": self.speaker,
            "audio_params": {
                "format": "mp3",
                "sample_rate": self.sample_rate,
                "speech_rate": self.speech_rate,
                "loudness_rate": self.loudness_rate,
            },
        }
        if self.emotion_enabled and emotion and emotion != "neutral":
            req_params.update(
                {
                    "enable_emotion": True,
                    "emotion": emotion,
                    "emotion_scale": max(
                        1.0, min(5.0, emotion_scale or self.emotion_scale)
                    ),
                }
            )
        return {
            "user": {"uid": "open-llm-vtuber"},
            "req_params": req_params,
        }

    async def _stream_audio(
        self, request: dict[str, Any], headers: dict[str, str], cache_file: str
    ) -> str:
        try:
            async with connect(
                self.endpoint,
                additional_headers=headers,
                open_timeout=self.timeout_seconds,
                close_timeout=5,
                max_size=None,
            ) as websocket:
                await websocket.send(self._build_request_frame(request))
                with open(cache_file, "wb") as audio_file:
                    while True:
                        message = await asyncio.wait_for(
                            websocket.recv(), timeout=self.timeout_seconds
                        )
                        if isinstance(message, str):
                            raise VolcengineProtocolError(
                                "Volcengine returned an unexpected text frame"
                            )
                        event, payload = self._parse_response_frame(message)
                        if event == self._EVENT_TTS_RESPONSE:
                            audio_file.write(payload)
                        elif event == self._EVENT_SESSION_FINISHED:
                            break

            if not os.path.exists(cache_file) or os.path.getsize(cache_file) == 0:
                raise VolcengineProtocolError("Volcengine returned no audio data")
            logger.info("Volcengine TTS audio generated successfully")
            return cache_file
        except Exception:
            raise

    @staticmethod
    def _build_request_frame(request: dict[str, Any]) -> bytes:
        payload = json.dumps(request, ensure_ascii=False).encode("utf-8")
        # V3: version/header-size, full-client-request, JSON/no-compression, reserved.
        return (
            bytes((0x11, 0x10, 0x10, 0x00)) + struct.pack(">I", len(payload)) + payload
        )

    @classmethod
    def _parse_response_frame(cls, frame: bytes) -> tuple[int | None, bytes]:
        if len(frame) < 4:
            raise VolcengineProtocolError("Volcengine returned a truncated frame")

        header_size = (frame[0] & 0x0F) * 4
        message_type = frame[1] >> 4
        flags = frame[1] & 0x0F
        if header_size < 4 or len(frame) < header_size:
            raise VolcengineProtocolError("Volcengine returned an invalid frame header")
        offset = header_size

        if message_type == 0x0F:
            error_code, offset = cls._read_uint32(frame, offset, "error code")
            payload, _ = cls._read_sized_bytes(frame, offset, "error payload")
            detail = payload.decode("utf-8", errors="replace")
            raise VolcengineProtocolError(
                f"Volcengine TTS API error {error_code}: {detail}"
            )

        if message_type not in (0x09, 0x0B):
            raise VolcengineProtocolError(
                f"Unsupported Volcengine message type: 0x{message_type:x}"
            )

        event = None
        if flags & 0x04:
            event, offset = cls._read_uint32(frame, offset, "event")
            _, offset = cls._read_sized_bytes(frame, offset, "session id")

        payload, _ = cls._read_sized_bytes(frame, offset, "payload")
        return event, payload

    @staticmethod
    def _read_uint32(frame: bytes, offset: int, label: str) -> tuple[int, int]:
        if len(frame) < offset + 4:
            raise VolcengineProtocolError(f"Truncated Volcengine {label}")
        return struct.unpack_from(">I", frame, offset)[0], offset + 4

    @classmethod
    def _read_sized_bytes(
        cls, frame: bytes, offset: int, label: str
    ) -> tuple[bytes, int]:
        size, offset = cls._read_uint32(frame, offset, f"{label} length")
        end = offset + size
        if len(frame) < end:
            raise VolcengineProtocolError(f"Truncated Volcengine {label}")
        return frame[offset:end], end

    @staticmethod
    def _remove_partial_file(path: str) -> None:
        try:
            if os.path.exists(path):
                os.remove(path)
        except OSError as error:
            logger.warning(f"Failed to remove partial TTS audio: {error}")
