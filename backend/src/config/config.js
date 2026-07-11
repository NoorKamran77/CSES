import dotenv from 'dotenv';

dotenv.config();

const config = {
    mongoURI: process.env.MONGO_URI,
    databaseName: process.env.DATABASE_NAME,
};

if (!process.env.MONGO_URI || !process.env.DATABASE_NAME) {
    console.error('Error: MONGO_URI and DATABASE_NAME must be set in the .env file');
    process.exit(1);
}


export default config;