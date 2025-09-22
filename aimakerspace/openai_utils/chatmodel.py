import os
from typing import Any, AsyncIterator, Iterable, List, MutableMapping

from dotenv import load_dotenv
from openai import AsyncOpenAI, OpenAI

load_dotenv()

ChatMessage = MutableMapping[str, Any]


class ChatOpenAI:
    """Thin wrapper around the OpenAI chat completion APIs with Together AI support."""

    def __init__(self, model_name: str = "gpt-4o-mini", api_key: str = None, provider: str = "openai"):
        """
        Initialize chat model with support for both OpenAI and Together AI.
        
        Args:
            model_name: The model to use (e.g., "gpt-4o-mini" for OpenAI or "meta-llama/Llama-3.1-8B-Instruct-Turbo" for Together)
            api_key: API key for the provider (if None, reads from environment)
            provider: Either "openai" or "together"
        """
        self.model_name = model_name
        self.provider = provider
        
        if provider == "together":
            self._setup_together(api_key)
        else:
            self._setup_openai(api_key)

    def _setup_openai(self, api_key: str = None):
        """Setup OpenAI client"""
        self.openai_api_key = api_key if api_key else os.getenv("OPENAI_API_KEY")
        if self.openai_api_key is None:
            raise ValueError("OPENAI_API_KEY is not set")

        self._client = OpenAI(api_key=self.openai_api_key)
        self._async_client = AsyncOpenAI(api_key=self.openai_api_key)

    def _setup_together(self, api_key: str = None):
        """Setup Together AI client"""
        try:
            from together import Together, AsyncTogether
        except ImportError:
            raise ImportError(
                "Together AI package not installed. Install with: pip install together"
            )
        
        self.together_api_key = api_key if api_key else os.getenv("TOGETHER_API_KEY")
        if self.together_api_key is None:
            raise ValueError(
                "TOGETHER_API_KEY is not set. Please set it as an environment variable "
                "or pass it directly to the constructor."
            )

        self._client = Together(api_key=self.together_api_key)
        self._async_client = AsyncTogether(api_key=self.together_api_key)

    def run(
        self,
        messages: Iterable[ChatMessage],
        text_only: bool = True,
        **kwargs: Any,
    ) -> Any:
        """Execute a chat completion request.

        ``messages`` must be an iterable of ``{"role": ..., "content": ...}``
        dictionaries. When ``text_only`` is ``True`` (the default) only the
        completion text is returned; otherwise the full response object is
        provided.
        """

        message_list = self._coerce_messages(messages)
        
        if self.provider == "together":
            response = self._client.chat.completions.create(
                model=self.model_name, messages=message_list, **kwargs
            )
        else:
            response = self._client.chat.completions.create(
                model=self.model_name, messages=message_list, **kwargs
            )

        if text_only:
            return response.choices[0].message.content

        return response

    async def astream(
        self, messages: Iterable[ChatMessage], **kwargs: Any
    ) -> AsyncIterator[str]:
        """Yield streaming completion chunks as they arrive from the API."""

        message_list = self._coerce_messages(messages)
        
        if self.provider == "together":
            stream = await self._async_client.chat.completions.create(
                model=self.model_name, messages=message_list, stream=True, **kwargs
            )
        else:
            stream = await self._async_client.chat.completions.create(
                model=self.model_name, messages=message_list, stream=True, **kwargs
            )

        async for chunk in stream:
            content = chunk.choices[0].delta.content
            if content is not None:
                yield content

    def _coerce_messages(self, messages: Iterable[ChatMessage]) -> List[ChatMessage]:
        if isinstance(messages, list):
            return messages
        return list(messages)
