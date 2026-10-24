# Every Game Mode plays on the Big Screen

Many schools aren't one-to-one with devices, and the internet drops, so every Game Mode must be playable on the Big Screen (one teacher device, no student devices, nothing sent over the network) as well as on students' devices; a new Game Mode doesn't ship without it. The Big Screen is a choice made when setting up a Session, not a Game Mode of its own, and a Session never mixes the two. For now this ADR is what holds the line, not a shared Game Mode interface in the code, since the three engines don't share one.
