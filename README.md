# Clipshare
### Share clipboard over the network

![logo](https://github.com/slebetman/clipshare/raw/master/clipshare.png)

## Usage

To run as a server:

    clipshare -server <port>

To connect to a server:

    clipshare <host> <port>

Note: You only need one server to share clipboards between multiple machines.

**WARNING** : Clipshare communications are not encrypted in any way. If you need
encryption you can use a VPN or ssh tunnel to protect your clipshare sessions.
## Installation

Just install with npm:

    npm install -g clipshare
	
