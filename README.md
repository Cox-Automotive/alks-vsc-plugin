# ALKS_4_VSCODE

ALKS plugin for Visual Studio Code.

## Features

- Generate STS credentials for your ALKS accounts that you can drop into your active terminal. (`ALKS: New Session`)
- Open the AWS console for any ALKS account (`ALKS: Open Console`)

To re-syncronize your available accounts or to logout use the settings command: `ALKS: Settings`.

## Extension Settings

This extension contributes the following settings:

* `alks.server`: The base URL for your ALKS server. Be sure to end with `/rest`.
* `alks.accounts`: A string array of ALKS project specific accounts. These will be displayed at the top of the account pick list.

## Installation Instructions

1. Download [alks.vsix](dist/alks.vsix)
2. In VS Code open the extensions panel, click the elipsis in the top right corner and select _Install from VSIX_.

## Known Issues

No known issues.

## Release Notes

First release!

### 1.0.0

Initial release of ALKS VSCode Plugin
