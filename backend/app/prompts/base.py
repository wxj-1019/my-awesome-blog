"""
Prompt Base Classes
Prompt 基类和接口定义
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class PromptVariable(BaseModel):
    """
    Prompt 变量定义
    """
    name: str = Field(..., description="变量名称")
    type: str = Field(..., description="变量类型")
    default: Optional[Any] = Field(None, description="默认值")
    required: bool = Field(default=True, description="是否必填")
    description: Optional[str] = Field(None, description="变量描述")


class PromptTemplate(BaseModel):
    """
    Prompt 模板基类
    """
    template: str = Field(..., description="模板内容")
    variables: Dict[str, PromptVariable] = Field(default_factory=dict, description="变量定义")
    
    def render(self, **kwargs) -> str:
        """
        渲染模板
        
        Args:
            **kwargs: 变量值
        
        Returns:
            str: 渲染后的内容
        """
        result = self.template
        for var_name, var_def in self.variables.items():
            value = kwargs.get(var_name, var_def.default)
            if var_def.required and value is None:
                raise ValueError(f"Required variable '{var_name}' not provided")
            if value is not None:
                result = result.replace(f"{{{{{var_name}}}}}", str(value))
                result = result.replace(f"${var_name}", str(value))
        return result
    
    def validate_variables(self, **kwargs) -> Dict[str, Any]:
        """
        验证变量
        
        Args:
            **kwargs: 变量值
        
        Returns:
            Dict[str, Any]: 验证后的变量
        """
        validated = {}
        for var_name, var_def in self.variables.items():
            value = kwargs.get(var_name, var_def.default)
            
            if var_def.required and value is None:
                raise ValueError(f"Required variable '{var_name}' not provided")
            
            if value is not None:
                if var_def.type == "string":
                    validated[var_name] = str(value)
                elif var_def.type == "number":
                    validated[var_name] = float(value)
                elif var_def.type == "boolean":
                    if isinstance(value, str):
                        validated[var_name] = value.lower() in ("true", "1", "yes")
                    else:
                        validated[var_name] = bool(value)
                elif var_def.type == "select":
                    if value not in var_def.default.get("options", []):
                        raise ValueError(f"Invalid value for '{var_name}': {value}")
                    validated[var_name] = value
                else:
                    validated[var_name] = value
        
        return validated
    
    def extract_variables(self, content: str) -> List[str]:
        """
        从内容中提取变量
        
        Args:
            content: 模板内容
        
        Returns:
            List[str]: 变量名列表
        """
        import re
        pattern = r'\{\{(\w+)\}\}|\\$\\(\\w+\\)'
        matches = re.findall(pattern, content)
        return list(set(matches))


class PromptBase(ABC):
    """
    Prompt 抽象基类
    """
    
    @abstractmethod
    def render(self, **kwargs) -> str:
        """
        渲染 Prompt
        
        Args:
            **kwargs: 变量值
        
        Returns:
            str: 渲染后的内容
        """
        pass
    
    @abstractmethod
    def validate(self, **kwargs) -> bool:
        """
        验证 Prompt
        
        Args:
            **kwargs: 变量值
        
        Returns:
            bool: 是否有效
        """
        pass


class SystemPrompt(PromptBase):
    """
    系统 Prompt
    用于定义 AI 的系统行为
    """
    
    def __init__(self, template: str, variables: Dict[str, PromptVariable] = None):
        self.template = PromptTemplate(template=template, variables=variables or {})
    
    def render(self, **kwargs) -> str:
        return self.template.render(**kwargs)
    
    def validate(self, **kwargs) -> bool:
        try:
            self.template.validate_variables(**kwargs)
            return True
        except ValueError:
            return False


class UserPrompt(PromptBase):
    """
    用户 Prompt
    用于用户自定义的对话模板
    """
    
    def __init__(self, template: str, variables: Dict[str, PromptVariable] = None):
        self.template = PromptTemplate(template=template, variables=variables or {})
    
    def render(self, **kwargs) -> str:
        return self.template.render(**kwargs)
    
    def validate(self, **kwargs) -> bool:
        try:
            self.template.validate_variables(**kwargs)
            return True
        except ValueError:
            return False
