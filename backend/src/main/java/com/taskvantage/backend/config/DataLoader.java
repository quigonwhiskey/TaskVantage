package com.taskvantage.backend.config;

import com.taskvantage.backend.model.Task;
import com.taskvantage.backend.model.TaskPriority;
import com.taskvantage.backend.model.User;
import com.taskvantage.backend.repository.TaskRepository;
import com.taskvantage.backend.repository.UserRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.io.FileReader;
import java.io.Reader;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class DataLoader {

    @Bean
    public CommandLineRunner loadData(UserRepository userRepository, TaskRepository taskRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Check if the test user already exists
            User user = userRepository.findByUsername("pat@example.com");
            if (user == null) {
                user = new User();
                user.setUsername("pat@example.com");
                user.setPassword(passwordEncoder.encode("password"));
                user.setEmailVerified(true);  // Set emailVerified to true for test user
                user.setVerificationToken(UUID.randomUUID().toString());  // Optional: Generate a token
                userRepository.save(user);
                System.out.println("Test user created: username=pat@example.com, password=password");
            } else {
                System.out.println("Test user already exists.");
            }

            // Load tasks from CSV file
            if (taskRepository.findAll().isEmpty()) {
                String csvFilePath = "./src/main/java/com/taskvantage/backend/data/task_test_data.csv";
                try (
                        Reader reader = new FileReader(Paths.get(csvFilePath).toFile());
                        CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.withFirstRecordAsHeader())
                ) {
                    List<Task> tasks = new ArrayList<>();
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

                    for (CSVRecord record : csvParser) {
                        Task task = new Task();
                        task.setTitle(record.get("title"));
                        task.setDescription(record.get("description"));
                        task.setPriority(TaskPriority.valueOf(record.get("priority")));
                        task.setStatus(record.get("status"));

                        // Parse LocalDateTime and convert to ZonedDateTime in UTC
                        task.setDueDate(LocalDateTime.parse(record.get("due_date"), formatter).atZone(ZoneOffset.UTC));
                        task.setCreationDate(LocalDateTime.parse(record.get("creation_date"), formatter).atZone(ZoneOffset.UTC));
                        task.setLastModifiedDate(LocalDateTime.parse(record.get("last_modified_date"), formatter).atZone(ZoneOffset.UTC));
                        task.setStartDate(LocalDateTime.parse(record.get("actual_start"), formatter).atZone(ZoneOffset.UTC));
                        task.setScheduledStart(LocalDateTime.parse(record.get("scheduledStart"), formatter).atZone(ZoneOffset.UTC));

                        // Handle optional completionDateTime
                        String completionDateTime = record.get("completionDateTime");
                        if (completionDateTime != null && !completionDateTime.isEmpty()) {
                            task.setCompletionDateTime(LocalDateTime.parse(completionDateTime, formatter).atZone(ZoneOffset.UTC));
                        }

                        // Set the userId for the task
                        task.setUserId(user.getId());

                        tasks.add(task);
                    }

                    taskRepository.saveAll(tasks);
                    System.out.println("Tasks imported from CSV and saved to database.");
                } catch (Exception e) {
                    e.printStackTrace();
                    System.out.println("Error loading tasks from CSV file.");
                }
            } else {
                System.out.println("Tasks already exist.");
            }
        };
    }
}