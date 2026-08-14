package com.investmentcrm.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;

@Configuration
public class FirebaseConfig {

    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        if (!FirebaseApp.getApps().isEmpty()) {
            return FirebaseApp.getInstance();
        }

        File serviceAccountFile = new File("serviceAccountKey.json");
        FirebaseOptions options;

        if (serviceAccountFile.exists()) {
            FileInputStream serviceAccount = new FileInputStream(serviceAccountFile);
            options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .setProjectId("sk-crm-1")
                    .build();
        } else {
            // Fallback development configuration if credential file is pending
            options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.newBuilder().build())
                    .setProjectId("sk-crm-1")
                    .build();
        }

        return FirebaseApp.initializeApp(options);
    }

    @Bean
    public Firestore firestore(FirebaseApp firebaseApp) {
        return FirestoreClient.getFirestore(firebaseApp);
    }
}
