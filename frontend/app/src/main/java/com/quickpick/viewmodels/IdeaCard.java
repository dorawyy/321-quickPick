package com.quickpick.viewmodels;

import android.content.Context;
import android.util.Log;
import android.widget.ImageView;
import android.widget.TextView;

import com.bumptech.glide.Glide;
import com.mindorks.placeholderview.annotations.Layout;
import com.mindorks.placeholderview.annotations.Resolve;
import com.mindorks.placeholderview.annotations.View;
import com.mindorks.placeholderview.annotations.swipe.SwipeIn;
import com.mindorks.placeholderview.annotations.swipe.SwipeOut;
import com.quickpick.R;
import com.quickpick.payloads.ChoicePayload;
import com.quickpick.payloads.IdeaPayload;

@Layout(R.layout.swipe_card_view)
public class IdeaCard {

    private final Context mContext;
    private final IdeaPayload mIdea;
    @View(R.id.idea_image)
    private ImageView ideaImage;
    @View(R.id.idea_text)
    private TextView ideaText;
    @View(R.id.idea_description)
    private TextView ideaDescriptionText;

    private ChoicePayload mChoice;

    public IdeaCard(IdeaPayload idea, Context context) {
        mContext = context;
        mIdea = idea;
    }

    public ChoicePayload getChoice() {
        return mChoice;
    }

    @Resolve
    private void onResolved() {
        Glide.with(mContext).load(mIdea.getPicture()).into(ideaImage);
        ideaText.setText(mIdea.getName());
        ideaDescriptionText.setText(mIdea.getDescription());
    }

    @SwipeOut
    private void onSwipedOut() { //left swipe == reject
        Log.d("EVENT", "onSwipedOut");
        mChoice = new ChoicePayload(new IdeaPayload(mIdea), false);
    }

    @SwipeIn
    private void onSwipeIn() { //right swipe
        Log.d("EVENT", "onSwipedIn");
        mChoice = new ChoicePayload(new IdeaPayload(mIdea), true);
    }
}
