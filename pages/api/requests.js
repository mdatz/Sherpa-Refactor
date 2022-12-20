import db from '../../lib/db';
import Request from '../../models/Request';

export default async function handler(req, res) {

    if(req.method === 'POST') {

        //initialize db connection
        await db();

        //Check body of request & Create a new request
        const { category, title, description, location, dates, duration, unit, startTime, groupSize, userId, userName, userAvatar } = req.body;

        //Validate userId exists
        if(!userId) {
            res.status(400).send({error: 'Invalid user ID'});
            return;
        }

        //validate userName exists
        if(!userName) {
            res.status(400).send({error: 'Invalid user name'});
            return;
        }

        //Validate userAvatar exists
        if(!userAvatar) {
            res.status(400).send({error: 'Invalid user avatar'});
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
        if(!location) {
            res.status(400).send({error: 'Invalid location'});
            return;
        }

        //Validate dates exists
        if(!dates || !dates.length) {
            res.status(400).send({error: 'Invalid dates'});
            return;
        }

        //Validate duration exists
        if(!duration) {
            res.status(400).send({error: 'Invalid duration'});
            return;
        }

        if(!unit) {
            res.status(400).send({error: 'Invalid unit'});
            return;
        }

        //Validate start time exists
        if(!startTime || !startTime.length) {
            res.status(400).send({error: 'Invalid start time'});
            return;
        }

        //Validate maxGroupSize exists
        if(!groupSize) {
            res.status(400).send({error: 'Invalid maxGroupSize'});
            return;
        }

        //Create new request
        const newRequest = new Request({
            category: category,
            title: title,
            description: description,
            location: location,
            dates: dates,
            duration: duration,
            startTime: startTime,
            unit: unit,
            groupSize: groupSize,
            userId: userId,
            userName: userName,
            userAvatar: userAvatar
        });

        //Save new request
        try {
            await newRequest.save();
            res.status(200).send({success: 'Request created'});
        } catch (err) {
            console.log(err)
            res.status(400).send({error: 'Error creating request'});
        }

        return;

    } else if(req.method === 'GET') {

        //initialize db connection
        await db();
    
        //Get all requests
        const requests = await Request.find({});
            
        //If the request exists, return it
        if(requests) {
            //Return the requests
            res.status(200).send(requests);
        } else {
            //Return an error
            res.status(404).send({error:'Could not return all request at this time! Try again later.'});
        }

        return;
    }

}