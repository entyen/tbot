for session in $(screen -ls | grep -o '[0-9]\{3,\}\.\S*')
    do
    	screen -r TelegramBot -p0 -X stuff "Bot is restarting.\015"
    	screen -r TelegramBot -p0 -X stuff "exit\015"
    done

counter=0
while [ $(screen -ls | grep -c 'No Sockets found in') -lt 1 ]; do
	if [ $(( $counter % 10 )) -eq 0 ]; then
		echo 'A previous server is in use. Waiting for 10 seconds before starting server...'
	fi

	sleep 1
	counter=$((counter+1))
done

echo 'Starting telegram bot...'

	screen -dmS "TelegramBot" node bot
	sleep 1
	while [ $(screen -ls | grep -c 'No Sockets found in') -ge 1 ]; do
		echo 'Waiting for 5 seconds to start server...'
		sleep 5
		screen -dmS "TelegramBot" node bot
	done

echo 'Telegram Bot started.'
