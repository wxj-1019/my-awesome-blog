from app.utils.json_utils import extract_first_json_object
import pytest

def test_plain_json():
    assert extract_first_json_object('{"a":1}') == '{"a":1}'

def test_json_with_surrounding_text():
    assert extract_first_json_object('好的 {"a":1} 完成') == '{"a":1}'

def test_two_json_objects_returns_first():
    assert extract_first_json_object('{"a":1} 解释 {"b":2}') == '{"a":1}'

def test_braces_inside_string():
    assert extract_first_json_object('{"code":"x{y}z"}') == '{"code":"x{y}z"}'

def test_no_json_raises():
    with pytest.raises(ValueError):
        extract_first_json_object('no json here')
