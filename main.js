import dotenv from 'dotenv';
dotenv.config();
import dbClient from './utils/db';

const waitConnection = () => {
    return new Promise((resolve, reject) => {
        let i = 0;
        const repeatFct = async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            i += 1;
            if (i >= 10) {
                reject(new Error('Connection timeout'));
            } else if (!dbClient.isAlive()) {
                repeatFct();
            } else {
                resolve();
            }
        };
        repeatFct();
    });
};

(async () => {
    console.log(dbClient.isAlive());
    await waitConnection();
    console.log(dbClient.isAlive());
    console.log(await dbClient.nbUsers());
    console.log(await dbClient.nbFiles());
})();

