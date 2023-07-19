import { createConnection, createServer } from 'net';

interface Output {
    name: string;
    host: string;
    port: number;
}

class Logger {
    info(message: string) {
        const currentDate = new Date().toISOString();
        const logMessage = `[${currentDate}] \x1b[32minfo\x1b[0m: ${message}`;
        console.log(logMessage);
    }

    error(message: string) {
        const currentDate = new Date().toISOString();
        const logMessage = `[${currentDate}] \x1b[31merror\x1b[0m: ${message}`;
        console.error(logMessage);
    }
}

const port = 30004;

/* Logger */
const logger = new Logger();

/* Network */
const outputsList: Output[] = [
    { name: 'ADSB.lol', host: 'feed.adsb.lol', port: 30004 },
    { name: 'ADSB.fi', host: 'feed.adsb.fi', port: 30004 },
    { name: 'ADSB.one', host: 'feed.adsb.one', port: 64004 },
    { name: 'ADSB.Exchange', host: 'feed1.adsbexchange.com', port: 30004 },
    { name: 'ADSB.Planespotters', host: 'feed.planespotters.net', port: 30004 }
];

const outputs = CreateOutputs(outputsList);

const input = createServer({ keepAlive: true, allowHalfOpen: true }, (socket) => {
    var address = `${socket.remoteAddress}:${socket.remotePort}`;
    logger.info(`INPUT: ${address} connected`);

    socket.on('data', (data) => {
        outputs.forEach((socket) => {
            socket.write(data);
        })
    });

    socket.on('close', (hadError) => {
        if (hadError) {
            logger.error(`INPUT: ${address} connection closed`);
        } else {
            logger.info(`INPUT: ${address} connection closed`);
        }
    });
})

input.on('error', (err) => {
    logger.error(`INPUT: ${err.message}`);
})

input.listen(port, () => logger.info(`ADSB-Router listening on port :${port}`));

function CreateOutputs(list: Output[]) {

    return list.map((output) => {
        var socket = createConnection({ host: output.host, port: output.port, keepAlive: true, keepAliveInitialDelay: 60000, allowHalfOpen: true });

        socket.on('connect', () => {
            logger.info(`OUTPUT: ${output.name} connected`);
        })

        socket.on('error', (err) => {
            logger.error(`OUTPUT: ${output.name} -> ${err.message}`);
        })

        socket.on('close', (hadError) => {
            if (hadError) {
                logger.info(`Reconnecting to ${output.name}`);
                setTimeout(() => socket.connect({ port: output.port, host: output.host, keepAlive: true }), 5000);
                return;
            }

            logger.info(`OUTPUT: ${output.name} closed`);
        })

        return socket;
    });
}

/**
 * 1. Start Server (check)
 * 2. Enable Outputs (check)
 * 3. Server received data => send to Outputs (check)
 * 4. Reconnect after error (check)
 */