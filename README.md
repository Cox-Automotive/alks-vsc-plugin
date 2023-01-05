# ALKS_4_VSCODE

ALKS plugin for Visual Studio Code.

## Features

###  Generate STS Credentials

`ALKS: New Session`

Create a STS session for a selected ALKS account. The session will be automagically exported to the selected terminal. You can set your default shell in the extension preferences to ensure a properly formatted export.

### New AWS Console

`ALKS: Open Console`

Open the AWS console for the selected  ALKS account. Note this supports both IAM and non-IAM roles.

### Settings

`ALKS: Settings`

To re-syncronize your available accounts or logout.

## Extension Settings

This extension contributes the following settings:

* `alks.server`: The base URL for your ALKS server. Be sure to end with `/rest`.
* `alks.accounts`: A string array of ALKS project specific accounts. These will be displayed at the top of the account pick list.
* `alks.shell`: The shell type to generate sessions for. Supports `bash/zsh`, `powershell` and `cmd`.

## Installation Instructions

1. Download [alks.vsix](dist/alks.vsix)
2. In VS Code open the extensions panel, click the elipsis in the top right corner and select _Install from VSIX_.

## Known Issues

- May have issues on some versions of Windows.


### 1.2.0

- AWS session variables are now exported automatically into the specified terminal instance.
- Shell type can be configured to properly format the session export for your preferred shell.

