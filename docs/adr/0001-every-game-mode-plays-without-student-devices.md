# Every Game Mode plays with no student devices

Many schools aren't one-to-one with devices, and the internet drops, so every Game Mode must be playable with no student devices (one teacher device, nothing sent over the network) as well as on Student Devices; a new Game Mode doesn't ship without it. Turning Student Devices off is a choice made when hosting a Session, not a Game Mode of its own, and a Session never mixes the two. For now this ADR is what holds the line, not a shared Game Mode interface in the code, since the three engines don't share one.
