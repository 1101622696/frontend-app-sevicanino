package com.misevicanino.app;

import com.getcapacitor.BridgeActivity;

import android.os.Bundle;

import com.getcapacitor.Plugin;

import java.util.ArrayList;

import com.capacitorjs.plugins.filesystem.FilesystemPlugin;
import com.capacitorjs.plugins.device.DevicePlugin;
import io.capawesome.capacitorjs.plugins.firebase.messaging.FirebaseMessagingPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Registra los plugins manualmente
        registerPlugin(FilesystemPlugin.class);  
        registerPlugin(DevicePlugin.class);
        registerPlugin(FirebaseMessagingPlugin.class);
    }
}
