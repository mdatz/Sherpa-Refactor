import db from '../../../lib/db'
import Posting from '../../../models/Posting'

export default async function handler(req, res) {

    await db();

    if(req.method === 'PUT') {

        //[TODO] - Check body of posting & Update posting
        res.status(200).send({success: 'Posting update route not yet finished...'});

    } else if(req.method === 'GET') {
    
        //Check query of request & Get all postings
        const postId = req.query.postId;
    
        //Validate the query parameters
        if(!postId || !postId.length) {
            res.status(400).send({error: 'No postId provided in query'});
            return;
        }
    
        //Get all postings
        const posting = await Posting.findOne({id: postId});
            
        //If the posting exists, return it
        if(posting) {
            //Return the postings
            res.status(200).send({posting: posting});
        } else {
            //Return an error
            res.status(404).send({error:'Posting not found'});
        }

    }

}