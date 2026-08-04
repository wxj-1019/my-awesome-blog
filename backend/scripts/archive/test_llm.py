"""
测试 LLM API 调用
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.llm import get_llm_provider, ChatCompletionRequest, ChatMessage


async def test_deepseek():
    """测试 DeepSeek API 调用"""
    print("=" * 50)
    print("开始测试 DeepSeek API 调用...")
    print("=" * 50)

    try:
        provider = get_llm_provider('deepseek')

        if provider is None:
            print("❌ 失败: DeepSeek Provider 创建失败")
            print("   请检查 DEEPSEEK_API_KEY 是否已正确配置")
            return

        print(f"✅ Provider 创建成功")
        print(f"   Provider: {provider.get_provider_name()}")
        print(f"   Model: {provider.get_model_name()}")
        print()

        request = ChatCompletionRequest(
            messages=[
                ChatMessage(role="user", content="你好，请用一句话介绍你自己")
            ],
            temperature=0.7,
            stream=False
        )

        print("📤 发送请求: 你好，请用一句话介绍你自己")
        print()

        response = await provider.chat(request)

        print("📥 收到响应:")
        print(f"   Role: {response.message.role}")
        print(f"   Content: {response.message.content}")
        print(f"   Model: {response.model}")

        if response.usage:
            print(f"   Usage:")
            print(f"     - Prompt tokens: {response.usage.prompt_tokens}")
            print(f"     - Completion tokens: {response.usage.completion_tokens}")
            print(f"     - Total tokens: {response.usage.total_tokens}")

        print()
        print("=" * 50)
        print("✅ DeepSeek API 调用测试成功！")
        print("=" * 50)

    except Exception as e:
        print()
        print("=" * 50)
        print(f"❌ DeepSeek API 调用测试失败！")
        print(f"   错误信息: {type(e).__name__}: {e}")
        print("=" * 50)


async def test_stream():
    """测试流式调用"""
    print()
    print("=" * 50)
    print("开始测试 DeepSeek 流式 API 调用...")
    print("=" * 50)

    try:
        provider = get_llm_provider('deepseek')

        if provider is None:
            print("❌ 失败: DeepSeek Provider 创建失败")
            return

        request = ChatCompletionRequest(
            messages=[
                ChatMessage(role="user", content="请写一首五言绝句，关于春天的诗")
            ],
            temperature=0.8,
            stream=True
        )

        print("📤 发送请求: 请写一首五言绝句，关于春天的诗")
        print()
        print("📥 流式响应:")

        full_content = ""
        async for chunk in provider.stream_chat(request):
            if chunk.content:
                print(chunk.content, end="", flush=True)
                full_content += chunk.content
            if chunk.finish_reason:
                print()

        print()
        print()
        print("=" * 50)
        print("✅ DeepSeek 流式 API 调用测试成功！")
        print("=" * 50)

    except Exception as e:
        print()
        print("=" * 50)
        print(f"❌ DeepSeek 流式 API 调用测试失败！")
        print(f"   错误信息: {type(e).__name__}: {e}")
        print("=" * 50)


async def main():
    """主测试函数"""
    await test_deepseek()
    await test_stream()


if __name__ == "__main__":
    asyncio.run(main())
