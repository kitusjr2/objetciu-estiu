#!/bin/bash
cd /home/z/my-project
while true; do
  echo "$(date): Starting dev server..."
  NODE_OPTIONS="--max-old-space-size=1536" bun --bun next dev -p 3000 2>&1
  EXIT=$?
  echo "$(date): Server exited with code $EXIT, restarting in 3s..."
  sleep 3
done
