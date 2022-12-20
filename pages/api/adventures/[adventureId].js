import db from '../../../lib/db'
import Adventure from '../../../models/Adventure'
import Offer from '../../../models/Offer'

export default async function handler(req, res) {

    const { adventureId } = req.query;

    await db();

    if(req.method === 'PUT') {

        //[TODO] - Overwrite the adventure with the new data
        res.status(200).send({success: 'Adventure update route not yet finished...'});

    } else if(req.method === 'PATCH') {

        //Update some fields in the adventure
        const op = req.body.op;
        const path = req.body.path;
        const value = req.body.value;

        if(!op || !op.length) {
            res.status(400).send({error: 'No op provided in body'});
            return;
        }

        if(!path || !path.length) {
            res.status(400).send({error: 'No path provided in body'});
            return;
        }

        if(!value || !value.length) {
            res.status(400).send({error: 'No value provided in body'});
            return;
        }

        let adventure;
        if(op === 'review'){
            adventure = await Adventure.findOne({referenceId: adventureId})
        }else{
            adventure = await Adventure.findOne({_id: adventureId});
        }

        if(!adventure) {
            res.status(404).send({error: 'Adventure not found'});
            return;
        }

        if(op === 'update') {

            const field = path.split('/').pop();

            //Update the adventure
            const updatedAdventure = await Adventure.updateOne({_id: adventureId}, {$set: {[field]: value}});

            //Return the updated adventure
            res.status(200).send(updatedAdventure);
    
        } else if(op === 'review') {

            //Add a review to the adventure
            const updatedAdventure = await Adventure.updateOne({_id: adventure._id, status: 'accepted'}, {$push: {reviews: value[0]}});

            //Update the Offer status to reviewed
            await Offer.updateOne({_id: adventureId}, {$set: {status: 'reviewed'}});

            //Return the updated adventure
            res.status(200).send(updatedAdventure);
    
        }else{
            res.status(400).send({error: 'Invalid op provided in body'});
            return;
        }


    } else if(req.method === 'GET') {
    
        //Check query of request & Get all postings
        const adventureId = req.query.adventureId;
    
        //Validate the query parameters
        if(!adventureId || !adventureId.length) {
            res.status(400).send({error: 'No adventureId provided in query'});
            return;
        }
    
        //Get a specific adventure
        const adventure = await Adventure.findOne({id: adventureId});
            
        //If the posting exists, return it
        if(adventure) {
            //Return the postings
            res.status(200).send({adventure: adventure});
        } else {
            //Return an error
            res.status(404).send({error: 'Adventure not found'});
        }
            
    }

}