import mongoose from 'mongoose';

export async function connect(){
    try{
        mongoose.connect(process.env.MONGODB_URI!);
        const connection = mongoose.connection;

        connection.once('connected', () => {
            console.log('MongoDB connection established');
        })

        connection.on('error', ()=>{
            console.error('MongoDB connection failed');
            process.exit();
        });
    } catch(err){
        console.error(err);
        process.exit();  
    }
}