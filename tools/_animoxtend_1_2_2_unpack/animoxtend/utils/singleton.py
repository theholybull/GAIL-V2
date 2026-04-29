"""Singleton metaclass implementation.

This module provides a Singleton metaclass that ensures only one instance
of a class is created. All subsequent instantiations return the same instance.

Example:
```python
class MyClass(metaclass=Singleton):
    pass

# These will return the same instance
a = MyClass()
b = MyClass()
assert a is b   # This will pass
```
"""

from typing import Any, ClassVar, Type


class Singleton(type):
    """Metaclass that ensures only one instance of a class exists.

    The Singleton metaclass keeps track of all instances of classes using this
    metaclass in a private dictionary. When a new instance is requested, it
    either returns an existing instance or creates a new one if none exists.
    """

    _instances: ClassVar[dict[Type, Any]] = {}

    def __call__(cls, *args: Any, **kwargs: Any) -> Any:
        """Return existing instance if it exists, otherwise create new instance.

        Args:
            *args: Variable length argument list passed to class constructor
            **kwargs: Arbitrary keyword arguments passed to class constructor

        Returns:
            The single instance of the class
        """
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]
