import React, { useState, useEffect } from 'react';
import API from '../services/api';

export const useComments = (ticketId) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    if (!ticketId) return;

    try {
      setLoading(true);
      const response = await API.get(`/comments?ticketId=${ticketId}`);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const createComment = async (text, mentions = []) => {
    try {
      const response = await API.post('/comments', {
        text,
        ticketId,
        mentions,
      });
      setComments([...comments, response.data.comment]);
      return { success: true, comment: response.data.comment };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  };

  const deleteComment = async (commentId) => {
    try {
      await API.delete(`/comments/${commentId}`);
      setComments(comments.filter((c) => c._id !== commentId));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  };

  useEffect(() => {
    fetchComments();
  }, [ticketId]);

  return {
    comments,
    loading,
    fetchComments,
    createComment,
    deleteComment,
  };
};
