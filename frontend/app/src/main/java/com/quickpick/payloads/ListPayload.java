package com.quickpick.payloads;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.google.gson.annotations.SerializedName;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

public class ListPayload implements Serializable {

    @Nullable
    private final String name;

    @Nullable
    private final String description;

    @Nullable
    @SerializedName("_id")
    private String id;

    @Nullable
    @SerializedName("userID")
    private final String userId;

    @Nullable
    private final List<IdeaPayload> ideas;

    public ListPayload() {
        this.name = "";
        this.description = "";
        this.ideas = new ArrayList<>();
        this.userId = "";
    }

    public ListPayload(@Nullable String name, @Nullable String description,
                       @Nullable List<IdeaPayload> ideas, @Nullable String userId) {
        this.name = name;
        this.description = description;
        this.ideas = ideas;
        this.userId = userId;
    }

    @NonNull
    public List<IdeaPayload> getIdeas() {
        return Collections.unmodifiableList(Optional.ofNullable(ideas).orElse(new ArrayList<>()));
    }

    @NonNull
    public String getName() {
        return Optional.ofNullable(name).orElse("");
    }

    @NonNull
    public String getId() {
        return Optional.ofNullable(id).orElse("");
    }

    @NonNull
    public String getDescription() {
        return Optional.ofNullable(description).orElse("");
    }

    @NonNull
    public String getUserId() {
        return Optional.ofNullable(userId).orElse("");
    }

}
