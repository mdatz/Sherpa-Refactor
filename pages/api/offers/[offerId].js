import db from '../../../lib/db'
import Offer from '../../../models/Offer'

export default async function handler(req, res) {

    const { offerId } = req.query;
    let offer;

    await db();

    if(req.method === 'PUT') {

        //[TODO] - Check body of posting & Update posting
        res.status(200).send({success: 'Offer update route not yet finished...'});

    } else if(req.method === 'GET') {
    
        //Check query of request & Get all postings
        const offerId = req.query.offerId;
    
        //Validate the query parameters
        if(!offerId || !offerId.length) {
            res.status(400).send({error: 'No offerId provided in query'});
            return;
        }
    
        //Get a specific offer
        offer = await Offer.findOne({id: offerId});
            
        //If the posting exists, return it
        if(offer) {
            //Return the postings
            res.status(200).send({offer: offer});
        } else {
            //Return an error
            res.status(404).send({error: 'Offer not found'});
        }
            
    } else if(req.method === 'POST') {

        //Check body of request for op field
        const op = req.body.op;

        if(!op || !op.length) {
            res.status(400).send({error: 'No op provided in body'});
            return;
        }

        switch(op){
            case 'accept':

                //Get the offer 
                offer = await Offer.findOne({_id: offerId});

                //Set the offer to accepted
                await Offer.updateOne({_id: offerId}, {$set: {status: 'accepted'}});

                //Set the other offers to declined
                await Offer.updateMany({_id: {$ne: offerId}, requestId: offer.requestId}, {$set: {status: 'declined'}});

                //Return the updated offer
                res.status(200).send();

                break;

            case 'decline':
                
                //Nothing here yet
                break;

            default:
                res.status(400).send({error: 'Invalid op provided in body'});
                return;
        }

        return;
    }

}