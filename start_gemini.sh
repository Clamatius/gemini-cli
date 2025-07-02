#!/bin/bash

# Create a logs directory if it doesn't exist to store session trajectories.
mkdir -p logs

# Define a unique log file name with a timestamp.
LOG_FILE="logs/gemini_trajectory_$(date +'%Y%m%d_%H%M%S').log"

# Announce the start and the log file location.
echo "🚀 Starting Gemini CLI session..."
echo "📝 Logging trajectory to: $LOG_FILE"
echo "--------------------------------------------------"

# Experimental "free" mode
export GEMINI_API_KEY=

# Run the active protocols.
/Users/mcooper/workspace/gemini-experiment/ambler-protocol-evolution/meta.sh run

# Execute the gemini command using the 'script' command to preserve interactivity.
# The '-q' flag runs script in quiet mode.
# 'script' starts a new shell and records everything, including interactive sessions.

# Local-launcher
#script -q "$LOG_FILE" node /Users/mcooper/workspace/gemini-workspace/gemini-cli/packages/cli/dist/src/gemini.js "$@"


# Default launcher
script -q "$LOG_FILE" gemini "$@"
