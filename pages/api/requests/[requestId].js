import db from '../../../lib/db'
import Request from '../../../models/Request'

export default async function handler(req, res) {

    await db();

    if(req.method === 'PUT') {

        //[TODO] - Check body of posting & Update posting
        res.status(200).send({success: 'Request update route not yet finished...'});

    } else if(req.method === 'GET') {
    
        //Check query of request & Get all postings
        const requestId = req.query.requestId;
    
        //Validate the query parameters
        if(!requestId || !requestId.length) {
            res.status(400).send({error: 'No requestId provided in query'});
            return;
        }
    
        //Get a specific request
        const request = await Request.findOne({id: requestId});
            
        //If the posting exists, return it
        if(request) {
            //Return the postings
            res.status(200).send({request: request});
        } else {
            //Return an error
            res.status(404).send({error: 'Request not found'});
        }
            
    }

}