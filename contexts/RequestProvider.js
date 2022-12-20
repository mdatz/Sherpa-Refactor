import React, { useContext, useCallback } from 'react'
import useSWR from "swr";

//Default SWR fetcher
const fetcher = (...args) => fetch(...args).then(res => res.json());

const RequestContext = React.createContext();

export function useRequests(){
   return useContext(RequestContext);
}

export function RequestProvider({ children }) {

    //Create a new request
    const createRequest = useCallback(async (request) => {
        const res = await fetch('/api/requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
        });
        return res.json();
    }, []);

    //Update a request
    const updateRequest = useCallback(async (request) => {
        const res = await fetch('/api/requests', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
        });
        return res.json();
    }, []);

    //Get all requests
    const getAllRequests = useCallback(async () => {
        const {data, error} = useSWR('/api/requests', fetcher);
        return {
            requests: data,
            isLoading: !error && !data,
            isError: error
        };
    }, []);

    //Get a specific request
    const getRequest = useCallback(async (id) => {
        const {data, error} = useSWR(`/api/requests/${id}`, fetcher);
        return {
            request: data,
            isLoading: !error && !data,
            isError: error
        };
    }, []);

    //Get all requests for a specific user
    const getUserRequests = useCallback(async (userId) => {
        const {data, error} = useSWR(`/api/requests/user/${userId}`, fetcher);
        return {
            requests: data,
            isLoading: !error && !data,
            isError: error
        };
    }, []);

    const value={
        getAllRequests,
        createRequest,
        updateRequest,
        getRequest,
        getUserRequests
    };

    return (
        <RequestContext.Provider value={value}>
            {children}
        </RequestContext.Provider>
    )
}