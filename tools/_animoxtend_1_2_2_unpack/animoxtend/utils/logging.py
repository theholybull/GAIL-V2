"""AnimoXtend logger setup.

It's inspired by Werkzeug's logger setup.
"""

import logging
import sys
from types import MappingProxyType
from typing import Mapping

from ..config import Config
from .singleton import Singleton

_LOGGER_NAME = Config.lower_name
_DEFAULT_LEVEL = Config.logging_level


class XLogger(metaclass=Singleton):
    """Custom logger for AnimoXtend."""

    def __init__(self, name: str = _LOGGER_NAME, level: int = _DEFAULT_LEVEL) -> None:
        self.name = name
        self.level = level
        self._logger: logging.Logger = self._init_log(name, level)

    def debug(self, msg: object, *args: object, **kwargs):
        """
        Log 'msg % args' with severity 'DEBUG'.

        To pass exception information, use the keyword argument exc_info with
        a true value, e.g.

        logger.debug("Houston, we have a %s", "thorny problem", exc_info=True)
        """
        self._log(logging.DEBUG, msg, *args, **kwargs)

    def info(self, msg: object, *args: object, **kwargs):
        """
        Log 'msg % args' with severity 'INFO'.

        To pass exception information, use the keyword argument exc_info with
        a true value, e.g.

        logger.info("Houston, we have a %s", "interesting problem", exc_info=True)
        """
        self._log(logging.INFO, msg, *args, **kwargs)

    def warning(self, msg: object, *args: object, **kwargs):
        """
        Log 'msg % args' with severity 'WARNING'.

        To pass exception information, use the keyword argument exc_info with
        a true value, e.g.

        logger.warning("Houston, we have a %s", "bit of a problem", exc_info=True)
        """
        self._log(logging.WARNING, msg, *args, **kwargs)

    def error(self, msg: object, *args: object, **kwargs):
        """
        Log 'msg % args' with severity 'ERROR'.

        To pass exception information, use the keyword argument exc_info with
        a true value, e.g.

        logger.error("Houston, we have a %s", "major problem", exc_info=True)
        """
        self._log(logging.ERROR, msg, *args, **kwargs)

    def exception(self, msg: object, *args: object, exc_info=True, **kwargs):
        """
        Convenience method for logging an ERROR with exception information.
        """
        self._log(logging.ERROR, msg, *args, exc_info=exc_info, **kwargs)

    def critical(self, msg: object, *args: object, **kwargs):
        """
        Log 'msg % args' with severity 'CRITICAL'.

        To pass exception information, use the keyword argument exc_info with
        a true value, e.g.

        logger.critical("Houston, we have a %s", "major disaster", exc_info=True)
        """
        self._log(logging.CRITICAL, msg, *args, **kwargs)

    def log(self, level: int, msg: object, *args: object, **kwargs):
        """
        Log 'msg % args' with the integer severity 'level'.

        To pass exception information, use the keyword argument exc_info with
        a true value, e.g.

        logger.log(level, "We have a %s", "mysterious problem", exc_info=True)
        """
        self._log(level, msg, *args, **kwargs)

    def setLevel(self, level: int) -> None:
        """
        Set the logging level of this logger.  level must be an int or a str.
        """
        self.level = level
        self._logger.setLevel(level)

    def _log(
        self,
        level: int,
        msg: object,
        *args: object,
        exc_info=None,
        stack_info: bool = False,
        stacklevel: int = 3,
        extra: Mapping[str, object] | None = None,
    ):
        """Log a message to the 'AnimoXtend' logger.

        The logger is created the first time it is needed. If there is no
        level set, it is set to :data:`logging.INFO`. If there is no handler
        for the logger's effective level, a :class:`logging.StreamHandler`
        is added.
        """
        # ? `stacklevel` has been set to 3 by default, so that it reflects the correct place of the caller
        self._logger.log(
            level,
            msg,
            *args,
            exc_info=exc_info,
            extra=extra,
            stack_info=stack_info,
            stacklevel=stacklevel,
        )

    @classmethod
    def _init_log(cls, name, level):
        """Initialize the logger."""
        _logger = logging.getLogger(name)
        if _logger.level == logging.NOTSET:
            _logger.setLevel(level)
        if not _has_level_handler(_logger):
            handler = _ColorStreamHandler()
            formatter = _ColorFormatter()
            handler.setFormatter(formatter)
            _logger.addHandler(handler)
        return _logger


def _has_level_handler(logger: logging.Logger) -> bool:
    """Check if there is a handler in the logging chain that will handle
    the given logger's effective level.
    """
    level = logger.getEffectiveLevel()
    current = logger

    while current:
        if any(handler.level <= level for handler in current.handlers):
            return True

        if not current.propagate:
            break

        current = current.parent  # type: ignore

    return False


class _ColorStreamHandler(logging.StreamHandler):  # type: ignore[type-arg]
    """On Windows, wrap stream with Colorama for ANSI style support."""

    def __init__(self) -> None:
        try:
            import colorama
        except ImportError:
            stream = None
        else:
            stream = colorama.AnsiToWin32(sys.stderr)

        super().__init__(stream)


class _ColorFormatter(logging.Formatter):
    """Custom formatter that includes color codes"""

    _log_fmt = "[%(asctime)s][%(levelname)s][%(name)s](%(filename)s:%(lineno)d) %(message)s"
    _datefmt = "%Y-%m-%d %H:%M:%S"
    # Define color codes
    _colors = MappingProxyType(
        {
            'DEBUG': '\033[96m',  # Cyan-#54afbb
            'INFO': '\033[94m',  # Blue-#61afef
            'WARNING': '\033[93m',  # Yellow-#e5c07b
            'ERROR': '\033[91m',  # Red-#e06c75
            'CRITICAL': '\033[91m',  # Red-#e06c75
            'END_C': '\033[0m',  # End of color
        }
    )

    def format(self, record):
        color = self._colors.get(record.levelname)
        fmt = self._log_fmt
        if color is not None:
            fmt = f"{color}{fmt}{self._colors['END_C']}"
        formatter = logging.Formatter(fmt, datefmt=self._datefmt)
        try:
            return formatter.format(record)
        except Exception:
            try:
                logger.exception("Error formatting log message")
            except Exception:
                pass
            return super().format(record)


logger: XLogger = XLogger()
