import { db } from '../firebaseConfig';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    Timestamp,
    serverTimestamp,
    arrayUnion
} from 'firebase/firestore';
import { Lead, Comment, LeadStatus } from '../types';

const LEADS_COLLECTION = 'leads';

export const LeadService = {
    // Subscribe to real-time updates
    subscribeToLeads: (callback: (leads: Lead[]) => void) => {
        const q = query(collection(db, LEADS_COLLECTION), orderBy('created_at', 'desc'));

        return onSnapshot(q, (snapshot) => {
            const leads = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Lead[];
            callback(leads);
        });
    },

    // Add a new lead
    addLead: async (lead: Omit<Lead, 'id'>) => {
        try {
            await addDoc(collection(db, LEADS_COLLECTION), {
                ...lead,
                created_at: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error adding lead: ", error);
            throw error;
        }
    },

    // Update a lead status
    updateLeadStatus: async (leadId: string, status: LeadStatus) => {
        try {
            const leadRef = doc(db, LEADS_COLLECTION, leadId);
            await updateDoc(leadRef, {
                status: status
            });
        } catch (error) {
            console.error("Error updating status: ", error);
            throw error;
        }
    },

    // Add a comment to a lead (stored as an array within the lead document for simplicity, 
    // or could be a subcollection. Using array for now to match local storage structure)
    addComment: async (leadId: string, comment: string) => {
        // Note: In a real app, comments might be a subcollection. 
        // For this migration, we might need to adjust the data model if we want to stream comments separately.
        // However, the current App.tsx expects comments in a separate state.
        // To keep it simple and consistent with the "shared view" goal, let's create a 'comments' collection.
        try {
            await addDoc(collection(db, 'comments'), {
                leadId,
                comment_text: comment,
                timestamp: new Date().toISOString(),
                user: 'Admin' // Hardcoded for now
            });
        } catch (error) {
            console.error("Error adding comment: ", error);
            throw error;
        }
    },

    subscribeToComments: (callback: (comments: Comment[]) => void) => {
        const q = query(collection(db, 'comments'), orderBy('timestamp', 'asc'));
        return onSnapshot(q, (snapshot) => {
            const comments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Comment[];
            callback(comments);
        });
    }
};
