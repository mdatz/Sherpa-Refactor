import React, { useContext, useCallback } from 'react'
import useSWR from "swr";

//Default SWR fetcher
const fetcher = (...args) => fetch(...args).then(res => res.json());

const PostingContext = React.createContext();

export function usePostings(){
   return useContext(PostingContext);
}

export function PostingProvider({ children }) {

    //Get all postings
    const getAllPostings = useCallback(async () => {
        const {data, error} = useSWR('/api/postings', fetcher);
        return {
            postings: data,
            isLoading: !error && !data,
            isError: error
        };
    }, []);

    //Create a new posting
    const createPosting = useCallback(async (posting) => {
        const res = await fetch('/api/postings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(posting)
        });
        return res.json();
    }, []);

    //Update a posting
    const updatePosting = useCallback(async (posting) => {
        const res = await fetch('/api/postings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(posting)
        });
        return res.json();
    }, []);

    //Get a specific posting
    const getPosting = useCallback(async (id) => {
        const {data, error} = useSWR(`/api/postings/${id}`, fetcher);
        return {
            posting: data,
            isLoading: !error && !data,
            isError: error
        };
    }, []);

    //Get all postings for a specific user
    const getUserPostings = useCallback(async (userId) => {
        const {data, error} = useSWR(`/api/postings/user/${userId}`, fetcher);
        return {
            postings: data,
            isLoading: !error && !data,
            isError: error
        };
    }, []);

    const value={
        getAllPostings,
        createPosting,
        updatePosting,
        getPosting,
        getUserPostings
    };

    return (
        <PostingContext.Provider value={value}>
            {children}
        </PostingContext.Provider>
    )
}