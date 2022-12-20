import db from '../../lib/db';
import Offer from '../../models/Offer';

export default async function handler(req, res){

    if(req.method === 'POST') {

        //initialize db connection
        await db();

        //Check body of request & Create a new offer
        const { requestId, startDate, startTime, rate, unit, guideId, guideName, guideAvatar, providedEquipment, requiredEquipment } = req.body;

        //Validate request id exists in body
        if(!requestId || !requestId.length) {
            res.status(400).send({error: 'Invalid request ID'});
            return;
        }

        //Validate start date exists
        if(!startDate || !startDate.length) {
            res.status(400).send({error: 'Invalid Start Date'});
            return;
        }

        //Validate start time exists
        if(!startTime || !startTime.length) {
            res.status(400).send({error: 'Invalid Start Time'});
            return;
        }

        //Validate guide id exists in body
        if(!guideId || !guideId.length) {
            res.status(400).send({error: 'Invalid guide ID'});
            return;
        }

        //Validate guide name exists in body
        if(!guideName || !guideName.length) {
            res.status(400).send({error: 'Invalid guide name'});
            return;
        }

        //Validate guide avatar exists in body
        if(!guideAvatar || !guideAvatar.length) {
            res.status(400).send({error: 'Invalid guide avatar'});
            return;
        }

        //Validate hourly price exists
        if(!rate || isNaN(rate)) {
            res.status(400).send({error: 'Invalid Hourly Price'});
            return;
        }

        //Validate unit exists
        if(!unit || !unit.length) {
            res.status(400).send({error: 'Invalid Unit'});
            return;
        }

        //Validate provided equipment exists
        if(!providedEquipment || !providedEquipment.length) {
            res.status(400).send({error: 'Invalid Provided Equipment'});
            return;
        }

        //Validate required equipment exists
        if(!requiredEquipment || !requiredEquipment.length) {
            res.status(400).send({error: 'Invalid Required Equipment'});
            return;
        }

        //Create new offer
        const newOffer = new Offer({
            requestId: requestId,
            startDate: startDate,
            startTime: startTime,
            rate: rate,
            unit: unit,
            guideId: guideId,
            guideName: guideName,
            guideAvatar: guideAvatar,
            providedEquipment: providedEquipment,
            requiredEquipment: requiredEquipment
        });

        //Save new offer
        try {
            await newOffer.save();
            res.status(200).send({success: 'Offer created'});
        } catch (err) {
            console.log(err)
            res.status(400).send({error: 'Error creating offer'});
        }

        return;

    } else if(req.method === 'GET') {

        //initialize db connection
        await db();
    
        //Get all offers
        const offers = await Offer.find({});
            
        //If the offer exists, return it
        if(offers) {
            //Return the offers
            res.status(200).send(offers);
        } else {
            //Return an error
            res.status(404).send({error:'Could not return all offers at this time! Try again later.'});
        }

        return;
    }

}