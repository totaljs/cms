// Reads custom settings
$WORKFLOW('Settings', 'load');

if (RELEASE) {
	PAUSESERVER('database', true);
	setTimeout(() => PAUSESERVER('database', false), 2000);
}

// For backward compatibility
F.global = MAIN;
