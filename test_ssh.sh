#!/bin/bash
ssh -o ConnectTimeout=5 -o BatchMode=yes root@49.234.190.85 "echo SSH_CONNECTED && docker --version && docker compose version"
