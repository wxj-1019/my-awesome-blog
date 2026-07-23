# Endpoint 审计：async / to_thread / 鉴权

- 扫描目录：`backend/app/api/v1/endpoints/`
- 路由函数总数：**194**
- ⚠️ async+DB 且未见 to_thread/run_in_executor：**38**

> 生成方式：`python backend/scripts/audit_endpoints.py`（AST 静态扫描，非运行时）。
> `to_thread=Y` 表示函数体内出现 `asyncio.to_thread` 或 `run_in_executor`。
> 鉴权仅识别 Depends(get_current_*) 常见依赖。

## 汇总（按模块）

| 模块 | 路由数 | 公开 | 登录 | 超管 | optional | ⚠️ async+DB 无 offload |
|------|--------|------|------|------|----------|------------------------|
| agent | 2 | 0 | 1 | 1 | 0 | 1 |
| albums | 4 | 4 | 0 | 0 | 0 | 0 |
| analytics | 7 | 0 | 0 | 7 | 0 | 0 |
| articles | 17 | 11 | 3 | 3 | 0 | 5 |
| audit_logs | 3 | 0 | 0 | 3 | 0 | 0 |
| auth | 5 | 3 | 2 | 0 | 0 | 3 |
| categories | 7 | 4 | 0 | 3 | 0 | 0 |
| comments | 8 | 2 | 5 | 0 | 1 | 0 |
| conversations | 9 | 0 | 9 | 0 | 0 | 9 |
| friend_links | 6 | 3 | 0 | 3 | 0 | 0 |
| images | 5 | 0 | 3 | 2 | 0 | 0 |
| llm | 3 | 1 | 2 | 0 | 0 | 0 |
| memories | 11 | 0 | 11 | 0 | 0 | 9 |
| messages | 12 | 6 | 5 | 1 | 0 | 0 |
| monitoring | 5 | 1 | 0 | 4 | 0 | 0 |
| oss_upload | 3 | 0 | 3 | 0 | 0 | 3 |
| portfolio | 8 | 3 | 0 | 5 | 0 | 0 |
| prompts | 21 | 0 | 10 | 11 | 0 | 0 |
| statistics | 9 | 1 | 8 | 0 | 0 | 0 |
| subscriptions | 7 | 2 | 0 | 5 | 0 | 0 |
| tags | 7 | 4 | 0 | 3 | 0 | 0 |
| tenants | 9 | 0 | 5 | 4 | 0 | 1 |
| timeline_events | 5 | 2 | 0 | 3 | 0 | 0 |
| typewriter_contents | 7 | 3 | 0 | 4 | 0 | 0 |
| users | 12 | 2 | 6 | 4 | 0 | 5 |
| weather | 2 | 2 | 0 | 0 | 0 | 2 |

## 明细表

| 模块 | 方法 | 路径 | 函数 | async | DB | to_thread | 鉴权 | 风险 |
|------|------|------|------|-------|----|-----------|------|------|
| agent | POST | `/chat` | `agent_chat` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| agent | POST | `/polish` | `agent_polish` | Y | N | N | get_current_superuser | OK/无DB |
| albums | GET | `/` | `read_albums` | N | Y | N | 公开 | sync 路由（自占 worker） |
| albums | GET | `/featured/list` | `read_featured_albums` | N | Y | N | 公开 | sync 路由（自占 worker） |
| albums | GET | `/{album_id}` | `read_album_by_id` | N | Y | N | 公开 | sync 路由（自占 worker） |
| albums | GET | `/{album_id}/images` | `read_album_images` | N | Y | N | 公开 | sync 路由（自占 worker） |
| analytics | GET | `/content-insights` | `get_content_insights` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| analytics | GET | `/dashboard-summary` | `get_dashboard_summary` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| analytics | GET | `/engagement-stats` | `get_engagement_stats` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| analytics | GET | `/growth-stats` | `get_growth_stats` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| analytics | GET | `/monthly-stats` | `get_monthly_stats` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| analytics | GET | `/top-authors-by-articles` | `get_top_authors_by_articles` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| analytics | GET | `/top-authors-by-views` | `get_top_authors_by_views` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| articles | GET | `/` | `read_articles` | Y | Y | Y | 公开 | OK |
| articles | POST | `/` | `create_article` | Y | Y | Y | get_current_active_user | OK |
| articles | POST | `/batch/delete` | `batch_delete_articles` | Y | Y | Y | get_current_superuser | OK |
| articles | POST | `/batch/featured` | `batch_set_featured_articles` | Y | Y | Y | get_current_superuser | OK |
| articles | POST | `/batch/publish` | `batch_publish_articles` | Y | Y | Y | get_current_active_user | OK |
| articles | GET | `/cursor-paginated` | `read_articles_cursor_paginated` | Y | Y | N | 公开 | ⚠️ async+DB 无 to_thread |
| articles | GET | `/featured` | `read_featured_articles` | Y | Y | Y | 公开 | OK |
| articles | GET | `/popular` | `read_popular_articles` | Y | Y | Y | 公开 | OK |
| articles | GET | `/recommended` | `read_recommended_articles` | Y | Y | Y | 公开 | OK |
| articles | GET | `/related/{article_id}` | `read_related_articles` | Y | Y | Y | 公开 | OK |
| articles | GET | `/search` | `search_articles` | Y | Y | Y | 公开 | OK |
| articles | GET | `/search-fulltext` | `search_articles_fulltext` | Y | Y | Y | 公开 | OK |
| articles | GET | `/slug/{slug}` | `read_article_by_slug` | Y | Y | N | 公开 | ⚠️ async+DB 无 to_thread |
| articles | GET | `/test-public` | `test_public` | N | N | N | 公开 | OK/无DB |
| articles | DELETE | `/{article_id}` | `delete_article` | Y | Y | N | get_current_superuser | ⚠️ async+DB 无 to_thread |
| articles | GET | `/{article_id}` | `read_article_by_id` | Y | Y | N | 公开 | ⚠️ async+DB 无 to_thread |
| articles | PUT | `/{article_id}` | `update_article` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| audit_logs | GET | `/` | `read_audit_logs` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| audit_logs | GET | `/action/{action}` | `read_audit_logs_by_action` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| audit_logs | GET | `/user/{user_id}` | `read_audit_logs_by_user` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| auth | POST | `/login` | `login` | Y | Y | N | 公开 | ⚠️ async+DB 无 to_thread |
| auth | POST | `/login-json` | `login_json` | Y | Y | N | 公开 | ⚠️ async+DB 无 to_thread |
| auth | POST | `/logout` | `logout` | Y | N | N | get_current_active_user | OK/无DB |
| auth | GET | `/me` | `read_users_me` | Y | N | N | get_current_active_user | OK/无DB |
| auth | POST | `/register` | `register` | Y | Y | N | 公开 | ⚠️ async+DB 无 to_thread |
| categories | GET | `/` | `read_categories` | N | Y | N | 公开 | sync 路由（自占 worker） |
| categories | POST | `/` | `create_category` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| categories | GET | `/name/{name}` | `read_category_by_name` | N | Y | N | 公开 | sync 路由（自占 worker） |
| categories | DELETE | `/{category_id}` | `delete_category` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| categories | GET | `/{category_id}` | `read_category_by_id` | N | Y | N | 公开 | sync 路由（自占 worker） |
| categories | PUT | `/{category_id}` | `update_category` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| categories | GET | `/{category_id}/articles` | `read_articles_by_category` | N | Y | N | 公开 | sync 路由（自占 worker） |
| comments | GET | `/` | `read_comments` | N | Y | N | get_current_user_optional | sync 路由（自占 worker） |
| comments | POST | `/` | `create_comment` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| comments | DELETE | `/{comment_id}` | `delete_comment` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| comments | GET | `/{comment_id}` | `read_comment_by_id` | N | Y | N | 公开 | sync 路由（自占 worker） |
| comments | PUT | `/{comment_id}` | `update_comment` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| comments | POST | `/{comment_id}/approve` | `approve_comment` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| comments | POST | `/{comment_id}/reject` | `reject_comment` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| comments | GET | `/{comment_id}/replies` | `read_comment_replies` | N | Y | N | 公开 | sync 路由（自占 worker） |
| conversations | GET | `/` | `list_conversations` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| conversations | POST | `/` | `create_conversation` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| conversations | POST | `/chat` | `chat` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| conversations | POST | `/chat/stream` | `chat_stream` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| conversations | DELETE | `/{conversation_id}` | `delete_conversation` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| conversations | GET | `/{conversation_id}` | `get_conversation` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| conversations | PUT | `/{conversation_id}` | `update_conversation` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| conversations | DELETE | `/{conversation_id}/messages` | `delete_conversation_messages` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| conversations | GET | `/{conversation_id}/messages` | `get_conversation_messages` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| friend_links | GET | `/` | `read_friend_links` | N | Y | N | 公开 | sync 路由（自占 worker） |
| friend_links | POST | `/` | `create_friend_link` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| friend_links | DELETE | `/{friend_link_id}` | `delete_friend_link` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| friend_links | GET | `/{friend_link_id}` | `read_friend_link_by_id` | N | Y | N | 公开 | sync 路由（自占 worker） |
| friend_links | PUT | `/{friend_link_id}` | `update_friend_link` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| friend_links | POST | `/{friend_link_id}/click` | `track_friend_link_click` | N | Y | N | 公开 | sync 路由（自占 worker） |
| images | GET | `/` | `read_images` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| images | POST | `/` | `upload_image` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| images | DELETE | `/{image_id}` | `delete_image` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| images | GET | `/{image_id}` | `read_image_by_id` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| images | PUT | `/{image_id}` | `update_image` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| llm | POST | `/chat` | `chat` | Y | N | N | get_current_active_user | OK/无DB |
| llm | POST | `/chat/stream` | `stream_chat` | Y | N | N | get_current_active_user | OK/无DB |
| llm | GET | `/models` | `get_models` | Y | N | N | 公开 | OK/无DB |
| memories | GET | `/` | `list_memories` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| memories | POST | `/` | `create_memory` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| memories | POST | `/batch` | `batch_create_memories` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| memories | POST | `/cleanup` | `cleanup_expired_memories` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| memories | POST | `/search` | `search_memories` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| memories | GET | `/short-term/{conversation_id}` | `get_short_term_context` | Y | N | N | get_current_active_user | OK/无DB |
| memories | PUT | `/short-term/{conversation_id}` | `set_short_term_context` | Y | N | N | get_current_active_user | OK/无DB |
| memories | GET | `/stats/summary` | `get_memory_stats` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| memories | DELETE | `/{memory_id}` | `delete_memory` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| memories | GET | `/{memory_id}` | `get_memory` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| memories | PUT | `/{memory_id}` | `update_memory` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| messages | GET | `/` | `read_messages` | N | Y | N | 公开 | sync 路由（自占 worker） |
| messages | POST | `/` | `create_message` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| messages | GET | `/danmaku` | `read_danmaku_messages` | N | Y | N | 公开 | sync 路由（自占 worker） |
| messages | GET | `/stats/activity` | `read_message_activity` | N | Y | N | 公开 | sync 路由（自占 worker） |
| messages | GET | `/trending` | `read_trending_messages` | N | Y | N | 公开 | sync 路由（自占 worker） |
| messages | DELETE | `/{message_id}` | `delete_message` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| messages | GET | `/{message_id}` | `read_message_by_id` | N | Y | N | 公开 | sync 路由（自占 worker） |
| messages | PUT | `/{message_id}` | `update_message` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| messages | DELETE | `/{message_id}/hard` | `hard_delete_message` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| messages | POST | `/{message_id}/like` | `like_message` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| messages | GET | `/{message_id}/replies` | `read_message_replies` | N | Y | N | 公开 | sync 路由（自占 worker） |
| messages | POST | `/{message_id}/unlike` | `unlike_message` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| monitoring | GET | `/health` | `health_check` | Y | N | N | 公开 | OK/无DB |
| monitoring | GET | `/metrics` | `get_system_metrics` | Y | N | Y | get_current_superuser | OK/无DB |
| monitoring | GET | `/monitoring/analytics` | `get_analytics` | Y | N | N | get_current_superuser | OK/无DB |
| monitoring | GET | `/monitoring/logs` | `get_recent_logs` | Y | N | N | get_current_superuser | OK/无DB |
| monitoring | GET | `/monitoring/status` | `get_monitoring_status` | Y | N | Y | get_current_superuser | OK/无DB |
| oss_upload | POST | `/batch-upload` | `batch_upload_files_to_oss` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| oss_upload | DELETE | `/delete` | `delete_file_from_oss` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| oss_upload | POST | `/upload` | `upload_file_to_oss` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| portfolio | GET | `/` | `read_portfolio_items` | N | Y | N | 公开 | sync 路由（自占 worker） |
| portfolio | POST | `/` | `create_portfolio_item` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| portfolio | DELETE | `/{portfolio_item_id}` | `delete_portfolio_item` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| portfolio | GET | `/{portfolio_item_id}` | `read_portfolio_item_by_id` | N | Y | N | 公开 | sync 路由（自占 worker） |
| portfolio | PUT | `/{portfolio_item_id}` | `update_portfolio_item` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| portfolio | GET | `/{portfolio_item_id}/images` | `read_portfolio_images` | N | Y | N | 公开 | sync 路由（自占 worker） |
| portfolio | DELETE | `/{portfolio_item_id}/images/{image_id}` | `remove_image_from_portfolio_endpoint` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| portfolio | POST | `/{portfolio_item_id}/images/{image_id}` | `add_image_to_portfolio_endpoint` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| prompts | GET | `/` | `list_prompts` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| prompts | POST | `/` | `create_prompt` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| prompts | POST | `/ab-test/{group}/result` | `record_ab_test_result` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| prompts | POST | `/ab-test/{group}/select` | `select_ab_test_prompt` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| prompts | GET | `/default` | `get_default_prompt` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| prompts | GET | `/export` | `export_prompts` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| prompts | GET | `/folders` | `list_folders` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| prompts | POST | `/folders` | `create_folder` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| prompts | DELETE | `/folders/{folder_id}` | `delete_folder` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| prompts | PUT | `/folders/{folder_id}` | `update_folder` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| prompts | POST | `/import` | `import_prompts` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| prompts | POST | `/optimize` | `optimize_prompt` | N | N | N | get_current_active_user | OK/无DB |
| prompts | GET | `/stats` | `get_prompt_stats` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| prompts | GET | `/{name}/versions` | `get_prompt_versions` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| prompts | DELETE | `/{prompt_id}` | `delete_prompt` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| prompts | GET | `/{prompt_id}` | `get_prompt` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| prompts | PUT | `/{prompt_id}` | `update_prompt` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| prompts | POST | `/{prompt_id}/default` | `set_default_prompt` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| prompts | POST | `/{prompt_id}/duplicate` | `duplicate_prompt` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| prompts | POST | `/{prompt_id}/preview` | `preview_prompt` | N | N | N | get_current_active_user | OK/无DB |
| prompts | POST | `/{prompt_id}/usage` | `increment_prompt_usage` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| statistics | GET | `/articles` | `get_article_statistics` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| statistics | GET | `/articles/popular` | `get_popular_articles_statistics` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| statistics | GET | `/content` | `get_content_statistics` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| statistics | GET | `/general` | `get_general_statistics` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| statistics | GET | `/growth` | `get_growth_statistics` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| statistics | GET | `/overview` | `get_statistics_overview` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| statistics | GET | `/public/overview` | `get_public_statistics_overview` | N | Y | N | 公开 | sync 路由（自占 worker） |
| statistics | GET | `/users` | `get_user_statistics` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| statistics | GET | `/website` | `get_website_statistics` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| subscriptions | GET | `/` | `read_subscriptions` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| subscriptions | POST | `/` | `create_subscription` | N | Y | N | 公开 | sync 路由（自占 worker） |
| subscriptions | GET | `/count` | `get_subscribers_count` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| subscriptions | POST | `/unsubscribe` | `unsubscribe` | N | Y | N | 公开 | sync 路由（自占 worker） |
| subscriptions | DELETE | `/{subscription_id}` | `delete_subscription` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| subscriptions | GET | `/{subscription_id}` | `read_subscription_by_id` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| subscriptions | PUT | `/{subscription_id}` | `update_subscription` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| tags | GET | `/` | `read_tags` | N | Y | N | 公开 | sync 路由（自占 worker） |
| tags | POST | `/` | `create_tag` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| tags | GET | `/name/{tag_name}` | `read_tag_by_name` | N | Y | N | 公开 | sync 路由（自占 worker） |
| tags | DELETE | `/{tag_id}` | `delete_tag` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| tags | GET | `/{tag_id}` | `read_tag_by_id` | N | Y | N | 公开 | sync 路由（自占 worker） |
| tags | PUT | `/{tag_id}` | `update_tag` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| tags | GET | `/{tag_id}/articles` | `read_articles_by_tag` | N | Y | N | 公开 | sync 路由（自占 worker） |
| tenants | GET | `/` | `list_tenants` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| tenants | POST | `/` | `create_tenant` | Y | Y | N | get_current_superuser | ⚠️ async+DB 无 to_thread |
| tenants | GET | `/slug/{slug}` | `get_tenant_by_slug` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| tenants | DELETE | `/{tenant_id}` | `delete_tenant` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| tenants | GET | `/{tenant_id}` | `get_tenant` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| tenants | PUT | `/{tenant_id}` | `update_tenant` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| tenants | GET | `/{tenant_id}/config` | `get_tenant_config` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| tenants | GET | `/{tenant_id}/limits` | `check_tenant_limits` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| tenants | GET | `/{tenant_id}/usage` | `get_tenant_usage_stats` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| timeline_events | GET | `/` | `read_timeline_events` | N | Y | N | 公开 | sync 路由（自占 worker） |
| timeline_events | POST | `/` | `create_timeline_event` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| timeline_events | DELETE | `/{timeline_event_id}` | `delete_timeline_event` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| timeline_events | GET | `/{timeline_event_id}` | `read_timeline_event_by_id` | N | Y | N | 公开 | sync 路由（自占 worker） |
| timeline_events | PUT | `/{timeline_event_id}` | `update_timeline_event` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| typewriter_contents | GET | `/` | `read_typewriter_contents` | N | Y | N | 公开 | sync 路由（自占 worker） |
| typewriter_contents | POST | `/` | `create_typewriter_content` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| typewriter_contents | GET | `/active` | `read_active_typewriter_contents` | N | Y | N | 公开 | sync 路由（自占 worker） |
| typewriter_contents | DELETE | `/{content_id}` | `delete_typewriter_content` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| typewriter_contents | GET | `/{content_id}` | `read_typewriter_content` | N | Y | N | 公开 | sync 路由（自占 worker） |
| typewriter_contents | PUT | `/{content_id}` | `update_typewriter_content` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| typewriter_contents | POST | `/{content_id}/deactivate` | `deactivate_typewriter_content` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| users | GET | `/` | `read_users` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| users | POST | `/` | `create_user` | Y | Y | N | get_current_superuser | ⚠️ async+DB 无 to_thread |
| users | GET | `/admin` | `get_admin_user` | N | Y | N | 公开 | sync 路由（自占 worker） |
| users | GET | `/me` | `read_current_user` | N | N | N | get_current_active_user | OK/无DB |
| users | PUT | `/me` | `update_current_user` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| users | POST | `/me/avatar` | `upload_current_user_avatar` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| users | PUT | `/me/password` | `update_password` | Y | Y | N | get_current_active_user | ⚠️ async+DB 无 to_thread |
| users | GET | `/me/stats` | `read_current_user_stats` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| users | GET | `/public-info` | `get_public_info` | N | N | N | 公开 | OK/无DB |
| users | DELETE | `/{user_id}` | `delete_user` | N | Y | N | get_current_superuser | sync 路由（自占 worker） |
| users | GET | `/{user_id}` | `read_user_by_id` | N | Y | N | get_current_active_user | sync 路由（自占 worker） |
| users | PUT | `/{user_id}` | `update_user` | Y | Y | N | get_current_superuser | ⚠️ async+DB 无 to_thread |
| weather | GET | `/current` | `get_current_weather` | Y | Y | N | 公开 | ⚠️ async+DB 无 to_thread |
| weather | GET | `/forecast` | `get_weather_forecast` | Y | Y | N | 公开 | ⚠️ async+DB 无 to_thread |

## 优先处理清单

- `agent.agent_chat` — POST `/chat`
- `articles.read_articles_cursor_paginated` — GET `/cursor-paginated`
- `articles.read_article_by_slug` — GET `/slug/{slug}`
- `articles.delete_article` — DELETE `/{article_id}`
- `articles.read_article_by_id` — GET `/{article_id}`
- `articles.update_article` — PUT `/{article_id}`
- `auth.login` — POST `/login`
- `auth.login_json` — POST `/login-json`
- `auth.register` — POST `/register`
- `conversations.list_conversations` — GET `/`
- `conversations.create_conversation` — POST `/`
- `conversations.chat` — POST `/chat`
- `conversations.chat_stream` — POST `/chat/stream`
- `conversations.delete_conversation` — DELETE `/{conversation_id}`
- `conversations.get_conversation` — GET `/{conversation_id}`
- `conversations.update_conversation` — PUT `/{conversation_id}`
- `conversations.delete_conversation_messages` — DELETE `/{conversation_id}/messages`
- `conversations.get_conversation_messages` — GET `/{conversation_id}/messages`
- `memories.list_memories` — GET `/`
- `memories.create_memory` — POST `/`
- `memories.batch_create_memories` — POST `/batch`
- `memories.cleanup_expired_memories` — POST `/cleanup`
- `memories.search_memories` — POST `/search`
- `memories.get_memory_stats` — GET `/stats/summary`
- `memories.delete_memory` — DELETE `/{memory_id}`
- `memories.get_memory` — GET `/{memory_id}`
- `memories.update_memory` — PUT `/{memory_id}`
- `oss_upload.batch_upload_files_to_oss` — POST `/batch-upload`
- `oss_upload.delete_file_from_oss` — DELETE `/delete`
- `oss_upload.upload_file_to_oss` — POST `/upload`
- `tenants.create_tenant` — POST `/`
- `users.create_user` — POST `/`
- `users.update_current_user` — PUT `/me`
- `users.upload_current_user_avatar` — POST `/me/avatar`
- `users.update_password` — PUT `/me/password`
- `users.update_user` — PUT `/{user_id}`
- `weather.get_current_weather` — GET `/current`
- `weather.get_weather_forecast` — GET `/forecast`
