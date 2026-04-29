import warnings
from pathlib import Path

from ..config import Config as AddonConfig
from ..utils.logging import logger


class Config:
    folder_path = AddonConfig.get_assets_path()

    def load_animo_config(self) -> Path:
        warnings.warn("This method is deprecated since 1.0.0", DeprecationWarning, stacklevel=2)
        target_path = self.folder_path / "animo_config.json"
        logger.debug(f"animo_config.json path: {target_path}")
        return target_path

    def load_driver_presets(self) -> Path:
        target_path = self.folder_path / "driver_presets.json"
        logger.debug(f"driver_presets.json path: {target_path}")
        return target_path

    def load_assets_path(self) -> Path:
        target_path = self.folder_path
        logger.debug(f"assets path: {target_path}")
        return target_path
