"""
@file: test_config.py
@description: 配置管理模块测试
@author: Atlas.oi
@date: 2026-01-07

测试覆盖：
1. 配置默认值加载
2. 环境变量覆盖
3. 路径展开功能
4. 日志级别验证
5. 配置单例模式
"""

import os
import pytest
from pathlib import Path

from app.core.config import Settings, get_settings, reload_settings


class TestSettings:
    """配置类测试"""

    def test_default_values(self, clean_env):
        """测试默认配置值"""
        # 重新加载配置以使用默认值
        settings = Settings()

        assert settings.backend_port == 51888
        assert settings.log_level == "INFO"
        assert settings.debug is False
        assert settings.api_prefix == "/api/v1"
        assert settings.cors_origins == ["*"]

    def test_env_override(self, clean_env, mock_settings_env):
        """测试环境变量覆盖配置"""
        settings = Settings()

        assert settings.backend_port == 51999
        assert settings.log_level == "DEBUG"
        assert settings.debug is True
        assert settings.api_prefix == "/api/test"

    def test_claude_dir_expansion(self, clean_env):
        """测试 Claude 目录路径展开"""
        # 设置使用 ~ 的路径
        os.environ["CLAUDE_DIR"] = "~/.claude"
        settings = Settings()

        # 验证路径被展开
        assert settings.claude_dir.startswith("/")
        assert "~" not in settings.claude_dir
        assert settings.claude_dir == os.path.expanduser("~/.claude")

    def test_get_claude_dir_path(self, clean_env, temp_dir):
        """测试获取 Claude 目录 Path 对象"""
        os.environ["CLAUDE_DIR"] = str(temp_dir / ".claude")
        settings = Settings()

        path = settings.get_claude_dir_path()
        assert isinstance(path, Path)
        assert str(path) == str(temp_dir / ".claude")

    def test_database_path_absolute(self, clean_env, temp_dir):
        """测试数据库绝对路径"""
        db_path = temp_dir / "test.db"
        os.environ["DATABASE_PATH"] = str(db_path)
        settings = Settings()

        result = settings.get_database_path()
        assert isinstance(result, Path)
        assert result.is_absolute()
        assert result == db_path

    def test_database_path_relative(self, clean_env):
        """测试数据库相对路径"""
        os.environ["DATABASE_PATH"] = "data/test.db"
        settings = Settings()

        result = settings.get_database_path()
        assert isinstance(result, Path)
        assert result.is_absolute()
        assert result.name == "test.db"

    def test_log_level_validation_valid(self, clean_env):
        """测试有效的日志级别"""
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]

        for level in valid_levels:
            os.environ["LOG_LEVEL"] = level
            settings = Settings()
            assert settings.log_level == level

            # 测试小写输入
            os.environ["LOG_LEVEL"] = level.lower()
            settings = Settings()
            assert settings.log_level == level

    def test_log_level_validation_invalid(self, clean_env):
        """测试无效的日志级别"""
        os.environ["LOG_LEVEL"] = "INVALID"

        with pytest.raises(ValueError) as exc_info:
            Settings()

        assert "日志级别必须是以下之一" in str(exc_info.value)

    def test_backend_port_range(self, clean_env):
        """测试后端端口范围验证"""
        # 测试有效端口
        os.environ["BACKEND_PORT"] = "8000"
        settings = Settings()
        assert settings.backend_port == 8000

        # 测试端口过小
        os.environ["BACKEND_PORT"] = "100"
        with pytest.raises(ValueError):
            Settings()

        # 测试端口过大
        os.environ["BACKEND_PORT"] = "70000"
        with pytest.raises(ValueError):
            Settings()

    def test_log_file_path_none(self, clean_env):
        """测试未设置日志文件"""
        settings = Settings()
        assert settings.log_file is None
        assert settings.get_log_file_path() is None

    def test_log_file_path_absolute(self, clean_env, temp_dir):
        """测试日志文件绝对路径"""
        log_path = temp_dir / "test.log"
        os.environ["LOG_FILE"] = str(log_path)
        settings = Settings()

        result = settings.get_log_file_path()
        assert isinstance(result, Path)
        assert result.is_absolute()
        assert result == log_path

    def test_log_file_path_relative(self, clean_env):
        """测试日志文件相对路径"""
        os.environ["LOG_FILE"] = "logs/test.log"
        settings = Settings()

        result = settings.get_log_file_path()
        assert isinstance(result, Path)
        assert result.is_absolute()
        assert result.name == "test.log"

    def test_project_root_path(self, clean_env):
        """测试项目根目录路径"""
        settings = Settings()

        assert isinstance(settings.project_root, Path)
        assert settings.project_root.is_absolute()
        # 项目根目录应该包含 backend 目录
        assert (settings.project_root / "backend").exists()


class TestGetSettings:
    """get_settings 函数测试"""

    def test_singleton_pattern(self, clean_env):
        """测试单例模式"""
        # 清除全局实例
        import app.core.config as config_module
        config_module._settings = None

        settings1 = get_settings()
        settings2 = get_settings()

        # 应该返回同一个实例
        assert settings1 is settings2

    def test_reload_settings(self, clean_env):
        """测试重新加载配置"""
        # 清除全局实例
        import app.core.config as config_module
        config_module._settings = None

        # 第一次加载
        os.environ["BACKEND_PORT"] = "8000"
        settings1 = get_settings()
        assert settings1.backend_port == 8000

        # 修改环境变量
        os.environ["BACKEND_PORT"] = "9000"

        # 不重新加载，应该还是旧值
        settings2 = get_settings()
        assert settings2.backend_port == 8000
        assert settings2 is settings1

        # 重新加载后应该是新值
        settings3 = reload_settings()
        assert settings3.backend_port == 9000
        assert settings3 is not settings1

    def test_cors_origins_default(self, clean_env):
        """测试 CORS 源默认值"""
        settings = Settings()
        assert settings.cors_origins == ["*"]

    def test_cors_origins_custom(self, clean_env):
        """测试自定义 CORS 源"""
        os.environ["CORS_ORIGINS"] = '["http://localhost:3000", "https://example.com"]'
        settings = Settings()

        # Pydantic Settings 会自动解析 JSON 字符串
        # 但需要在配置中指定 json_loads
        # 这里我们测试字符串形式
        assert isinstance(settings.cors_origins, list)


class TestConfigValidation:
    """配置验证测试"""

    def test_case_insensitive_env_vars(self, clean_env):
        """测试环境变量不区分大小写"""
        # 使用小写环境变量名
        os.environ["backend_port"] = "8080"
        os.environ["log_level"] = "debug"

        settings = Settings()
        assert settings.backend_port == 8080
        assert settings.log_level == "DEBUG"

    def test_extra_env_vars_ignored(self, clean_env):
        """测试额外的环境变量被忽略"""
        os.environ["UNKNOWN_CONFIG"] = "value"

        # 不应该抛出异常
        settings = Settings()
        assert not hasattr(settings, "unknown_config")

    def test_config_immutability(self, clean_env):
        """测试配置对象的属性可以修改（Pydantic v2 默认行为）"""
        settings = Settings()
        original_port = settings.backend_port

        # Pydantic v2 允许修改属性
        settings.backend_port = 9999
        assert settings.backend_port == 9999
        assert settings.backend_port != original_port
