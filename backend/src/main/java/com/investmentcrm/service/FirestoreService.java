package com.investmentcrm.service;

import com.google.cloud.firestore.Firestore;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class FirestoreService {

    private final Firestore firestore;
    private final Map<String, Map<String, Map<String, Object>>> inMemoryStore = new ConcurrentHashMap<>();

    public FirestoreService(Firestore firestore) {
        this.firestore = firestore;
    }

    public void saveDocument(String collectionName, String documentId, Map<String, Object> data) {
        try {
            if (firestore != null) {
                firestore.collection(collectionName).document(documentId).set(data).get();
            }
        } catch (Exception ignored) {}
        inMemoryStore.computeIfAbsent(collectionName, k -> new ConcurrentHashMap<>()).put(documentId, data);
    }

    public Map<String, Object> getDocument(String collectionName, String documentId) {
        try {
            if (firestore != null) {
                var doc = firestore.collection(collectionName).document(documentId).get().get();
                if (doc.exists() && doc.getData() != null) {
                    return doc.getData();
                }
            }
        } catch (Exception ignored) {}
        Map<String, Map<String, Object>> coll = inMemoryStore.get(collectionName);
        return coll != null ? coll.get(documentId) : null;
    }

    public List<Map<String, Object>> getAllDocuments(String collectionName) {
        List<Map<String, Object>> list = new ArrayList<>();
        try {
            if (firestore != null) {
                var docs = firestore.collection(collectionName).get().get().getDocuments();
                for (var doc : docs) {
                    list.add(doc.getData());
                }
                if (!list.isEmpty()) return list;
            }
        } catch (Exception ignored) {}
        Map<String, Map<String, Object>> coll = inMemoryStore.get(collectionName);
        if (coll != null) {
            list.addAll(coll.values());
        }
        return list;
    }

    public void deleteDocument(String collectionName, String documentId) {
        try {
            if (firestore != null) {
                firestore.collection(collectionName).document(documentId).delete();
            }
        } catch (Exception ignored) {}
        Map<String, Map<String, Object>> coll = inMemoryStore.get(collectionName);
        if (coll != null) {
            coll.remove(documentId);
        }
    }
}
