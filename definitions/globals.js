// Reads custom settings
$WORKFLOW('Settings', 'load');

if (RELEASE) {
	F.wait('database', true);
	setTimeout(() => F.wait('database', false), 2000);
}

// For backward compatibility
F.global = MAIN;
