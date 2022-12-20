import db from '../../lib/db';
import Adventure from '../../models/Adventure';

export default async function handler(req, res) {

    if(req.method === 'POST') {

        //initialize db connection
        await db();

        //Check body of request & Create a new adventure
        const { referenceId, referenceType, startDate, endDate, startTime, guide, user, groupSize, price } = req.body;

        //Validate guide id exists in body
        if(!guide || !guide.length) {
            res.status(400).send({error: 'Invalid guide ID'});
            return;
        }

        //Validate user id exists in body
        if(!user || !user.length) {
            res.status(400).send({error: 'Invalid user ID'});
            return;
        }

        //Validate reference trip exists
        if(!referenceId || !referenceId.length) {
            res.status(400).send({error: 'Invalid reference ID'});
            return;
        }

        //Validate reference type exists
        if(!referenceType || !referenceType.length) {
            res.status(400).send({error: 'Invalid reference type'});
            return;
        }

        //Validate start date exists
        if(!startDate || !startDate.length) {
            res.status(400).send({error: 'Invalid Start Date'});
            return;
        }

        //Validate end date exists
        if(!endDate || !endDate.length) {
            res.status(400).send({error: 'Invalid End Date'});
            return;
        }

        //Validate start time exists
        if(!startTime || !startTime.length) {
            res.status(400).send({error: 'Invalid Start Time'});
            return;
        }

        //Validate group size exists
        if(!groupSize || !groupSize.length) {
            res.status(400).send({error: 'Invalid Group Size'});
            return;
        }

        //Validate price exists
        if(!price || !price.length) {
            res.status(400).send({error: 'Invalid Price'});
            return;
        }

        //Create new adventure
        const newAdventure = new Adventure({
            referenceId: referenceId,
            referenceType: referenceType,
            startDate: startDate,
            endDate: endDate,
            startTime: startTime,
            guide: guide,
            user: user,
            groupSize: groupSize,
            price: price,
            status: 'pending'
        });

        //Save new adventure
        try {
            await newAdventure.save();
            res.status(200).send({success: 'Adventure created'});
        } catch (err) {
            console.log(err)
            res.status(400).send({error: 'Error creating adventure'});
        }

        return;

    } else if(req.method === 'GET') {

        //initialize db connection
        await db();
    
        //Get all adventures
        const adventures = await Adventure.find({});
            
        //If the adventure exists, return it
        if(adventures) {
            //Return the adventures
            res.status(200).send(adventures);
        } else {
            //Return an error
            res.status(404).send({error:'Could not return all adventure at this time! Try again later.'});
        }

        return;
    }

}