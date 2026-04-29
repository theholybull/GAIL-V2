"""Request client for AnimoXtend.

This module provides a client for making HTTP requests to the AnimoXtend server.
And it handles authentication and error handling.
"""

from base64 import b64decode as d_
from urllib import parse

import requests
import urllib3
from requests.exceptions import RequestException

__all__ = ["XClient", "OfflineError", "RequestException"]


class OfflineError(RequestException):
    pass


class XClient:
    """Client for making HTTP requests to the AnimoXtend server."""

    DEFAULT_BASE = b"aHR0cHM6Ly96b2UtYXBpLnNlbnNldGltZS5jb20vYW5pbW94dGVuZA==\n"

    def __init__(self, base_url: str | None = None, api_key: str | None = None):
        """Initialize the client.

        Args:
            base_url (str): The base URL of the AnimoXtend server.
            api_key (str): The API key for authentication.

        Raises:
            RuntimeError: If AnimoXtend is in offline mode.
        """
        if base_url:
            base_url_obj = parse.urlparse(base_url)
            if base_url_obj.scheme:
                self.base_url = base_url_obj.geturl()
            else:
                part1 = d_(self.DEFAULT_BASE).decode("utf8").rstrip("/")
                part2 = base_url_obj.geturl().lstrip("/")
                self.base_url = f"{part1}/{part2}"
        else:
            self.base_url = ""

        if api_key is None:
            from ..preferences import get_preferences

            preferences = get_preferences()
            api_key = preferences.api_key
        self.api_key = api_key

    @staticmethod
    def check_online_access() -> bool:
        import bpy

        online_access = getattr(bpy.app, "online_access", None)
        if online_access is False:
            return False
        return True

    def auth_headers(self) -> dict:
        if not self.api_key:
            return {}
        return {
            "X-Api-Key": self.api_key,
            "apikey": self.api_key,
            "Authorization": f"Bearer {self.api_key}",
        }

    def request(self, method: str, endpoint: str, *, verify=False, **kwargs) -> requests.Response:
        """Make a request.

        Args:
            method (str): The HTTP method to use.
            endpoint (str): The endpoint to call.
            verify (bool): Whether to verify the SSL certificate.

        Returns:
            requests.Response: The response from the server.
        """
        if not self.check_online_access():
            raise OfflineError("Blender is in offline mode. Please allow online access.")

        url_obj = parse.urlparse(endpoint)
        if url_obj.scheme:
            full_url = url_obj.geturl()
        else:
            # Use base_url to construct full url
            # Make sure the base_url starts with http
            base_url = self.base_url.strip("/") or d_(self.DEFAULT_BASE).decode("utf8").strip("/")
            base_url_obj = parse.urlparse(base_url)
            assert base_url_obj.scheme, f"Base URL invalid: {base_url}"

            part1 = base_url_obj.geturl().rstrip("/")
            part2 = url_obj.geturl().lstrip("/")
            full_url = f"{part1}/{part2}"

        headers = self.auth_headers()
        if "headers" in kwargs:
            headers.update(kwargs.pop("headers"))
        response = requests.request(method, full_url, headers=headers, verify=verify, **kwargs)
        if response.status_code == 401:
            url_path = parse.urlparse(full_url).path
            raise RequestException(f'Unauthorized access for "{url_path}". Please check your API key.')
        response.raise_for_status()
        return response

    def get(self, endpoint: str, *, verify=False, **kwargs) -> requests.Response:
        """Make a GET request.

        Args:
            endpoint (str): The endpoint to call.
            verify (bool): Whether to verify the SSL certificate
            **kwargs: Additional keyword arguments to pass to the requests library.

        Returns:
            requests.Response: The response from the server.
        """
        return self.request("GET", endpoint, verify=verify, **kwargs)

    def post(self, endpoint: str, *, verify=False, **kwargs) -> requests.Response:
        """Make a POST request.

        Args:
            endpoint (str): The endpoint to call.
            verify (bool): Whether to verify the SSL certificate
            **kwargs: Additional keyword arguments to pass to the requests library.

        Returns:
            requests.Response: The response from the server.
        """
        return self.request("POST", endpoint, verify=verify, **kwargs)

    def put(self, endpoint: str, *, verify=False, **kwargs) -> requests.Response:
        """Make a PUT request.

        Args:
            endpoint (str): The endpoint to call.
            verify (bool): Whether to verify the SSL certificate
            **kwargs: Additional keyword arguments to pass to the requests library.

        Returns:
            requests.Response: The response from the server.
        """
        return self.request("PUT", endpoint, verify=verify, **kwargs)

    def delete(self, endpoint: str, *, verify=False, **kwargs) -> requests.Response:
        """Make a DELETE request.

        Args:
            endpoint (str): The endpoint to call.
            verify (bool): Whether to verify the SSL certificate
            **kwargs: Additional keyword arguments to pass to the requests library.

        Returns:
            requests.Response: The response from the server.
        """
        return self.request("DELETE", endpoint, verify=verify, **kwargs)


urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
