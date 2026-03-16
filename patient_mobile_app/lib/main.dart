import 'package:flutter/material.dart';
import 'screens/splash_screen.dart';

void main() {
  runApp(const VitalKeyApp());
}

class VitalKeyApp extends StatelessWidget {
  const VitalKeyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'VitalKey',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(primarySwatch: Colors.blue),
      home: const SplashScreen(),
    );
  }
}
