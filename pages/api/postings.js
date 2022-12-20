import db from '../../lib/db';
import Posting from '../../models/Posting';

export default async function handler(req, res) {

    if(req.method === 'POST') {

        //initialize db connection
        await db();

        //Check body of request & Create a new posting
        const { category, title, description, location, dates, maxGroupSize, rate, duration, unit, startTime, guideId, guideName, guideAvatar, providedEquipment, requiredEquipment } = req.body;

        //Validate creator id exists
        if(!guideId) {
            res.status(400).send({error: 'Invalid guide ID'});
            return;
        }

        //Validate creator name exists
        if(!guideName) {
            res.status(400).send({error: 'Invalid guide name'});
            return;
        }

        //Validate creator avatar exists
        if(!guideAvatar) {
            res.status(400).send({error: 'Invalid guide avatar'});
            return;
        }

        //Validate category exists
        if(!category || !category.length) {
            res.status(400).send({error: 'Invalid category'});
            return;
        }

        //Validate title exists
        if(!title || !title.length) {
            res.status(400).send({error: 'Invalid title'});
            return;
        }

        //Validate description exists
        if(!description || !description.length) {
            res.status(400).send({error: 'Invalid description'});
            return;
        }

        //Validate location exists
        if(!location || !location.length) {
            res.status(400).send({error: 'Invalid location'});
            return;
        }

        //Validate dates exists
        if(!dates || !dates.length) {
            res.status(400).send({error: 'Invalid dates'});
            return;
        }

        //Validate duration exists
        if(!duration || isNaN(duration)) {
            res.status(400).send({error: 'Invalid duration'});
            return;
        }

        //Validate start time exists
        if(!startTime || !startTime.length) {
            res.status(400).send({error: 'Invalid start time'});
            return;
        }

        //Validate maxGroupSize exists
        if(!maxGroupSize || isNaN(maxGroupSize)) {
            res.status(400).send({error: 'Invalid maxGroupSize'});
            return;
        }

        //Validate rate exists
        if(!rate || isNaN(rate)) {
            res.status(400).send({error: 'Invalid hourlyPrice'});
            return;
        }

        //Validate the unit is provided
        if(!unit || !unit.length) {
            res.status(400).send({error: 'Invalid unit'});
            return;
        }

        //Validate providedEquipment exists
        if(!providedEquipment || !providedEquipment.length) {
            res.status(400).send({error: 'Invalid providedEquipment'});
            return;
        }

        //Validate requiredEquipment exists
        if(!requiredEquipment || !requiredEquipment.length) {
            res.status(400).send({error: 'Invalid requiredEquipment'});
            return;
        }

        //Create new posting
        const newPosting = new Posting({
            category: category,
            title: title,
            description: description,
            location: location,
            dates: dates,
            maxGroupSize: maxGroupSize,
            rate: rate,
            duration: duration,
            unit: unit,
            startTime: startTime,
            guideId: guideId,
            guideName: guideName,
            guideAvatar: guideAvatar,
            providedEquipment: providedEquipment,
            requiredEquipment: requiredEquipment,
        });

        //Save new posting
        try {
            await newPosting.save();
            res.status(200).send({success: 'Posting created'});
        } catch (err) {
            console.log(err)
            res.status(400).send({error: 'Error creating posting'});
        }

        return;

    } else if(req.method === 'GET') {

        //initialize db connection
        await db();
    
        //Get all postings
        const postings = await Posting.find({});
            
        //If the posting exists, return it
        if(postings) {
            //Return the postings
            res.status(200).send(postings);
        } else {
            //Return an error
            res.status(404).send({error:'Could not return all posting at this time! Try again later.'});
        }

        return;
    }

}