echo 'Starting telegram bot...'

	screen -dmS "TelegramBot" npm run dev
	sleep 1
	while [ $(screen -ls | grep -c 'No Sockets found in') -ge 1 ]; do
		echo 'Waiting for 5 seconds to start server...'
		sleep 5
		screen -dmS "TelegramBot" npm run dev
	done

echo 'Telegram Bot started.'
