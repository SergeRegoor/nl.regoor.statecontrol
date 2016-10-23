# State Control app for Homey

The State Control app for Homey enables you to keep track of states in your home. For example, you can keep track of a home state (at home, away or sleeping), or the state of your lights in each room (off, switched manually, or switched by a motion sensor).

The goal of the app is to have a more structured method where multiple flows will manage devices.
Sounds abstract, eh? Let me explain by two examples as I have them in my home.

## Example 1: lights in a room
In my home, every "Homey-enabled" room has a Fibaro dimmer and one or more Fibaro motion sensors.

### The initial goal for lights
Lights should turn on when:
* Movement is detected, only after sundown
* The dimmer is switched on using the wall switch
* We ask Homey using speech

Lights should turn off when:
* No movement is detected, only after sundown
* The dimmer is switched off using the wall switch
* We ask Homey using speech

So for these to work, we need to create 6 flows in Homey's flow editor.
One of the issues with the above flows, is that if movement triggers the lights to switch on, the lights will automatically switch off when no movement is detected anymore.
So reading your book, or surfing the Athom forums suddenly takes place in darkness. We would need to get up and flick the wall switch, or ask Homey by speech to switch on the lights.
New world problems, but still annoying. We can fix this quite easily using Patrick Sannes' great Better Logic app, but it makes the flows more complex, as well.

### Things get a bit more complicated
Things get a little more complicated when I wanted to have a couple of flows that would switch off and switch on the lights:
* When we go to sleep, all lights should be switched off (some with a delay, so we can see where we need to walk to go to bed)
* When we leave the house, all lights should be switched off
* When we come home and it's after sundown, switch on some lights before the motion sensor triggers, to make the entrance a bit more comfortable

Again, I needed multiple variables in the Better Logic app to keep track of states, and to make sure the flows behave as expected.
But the complexity was getting cumbersome, partly because Homey's user interface for flows doesn't make it easy managing a lot of devices in a single flow.

For the above, we would need at least 3 more flows. So that's 9 flows, that all manage individual dimmers & switches.
Using the State Control app, we still need a number of flows, but they're more compact and easier to manage.

### How I solved it using the State Control app
First we would need to add a group in the settings page of the app, we call this group "House rooms".
In the newly created tab, we set up our rooms (living room, kitchen, hallway, etc).
Then we define the states for our rooms. In my case I created the following states: "Lights off", "Lights manual" and "Lights movement".
We check the "Priority" setting only for the "Lights manual" state. This setting makes sure that we can't just "overwrite" the state, ie overwrite the manual state with the movement state. We still don't like surfing the Athom forums in darkness.

Now that we have rooms and states, we apply the default state to the rooms (in my case, all rooms were set to "Lights off").

Then we continue with the actions, that will enable us later to do our magic.
I created the following actions:
1. Switch lights on (no additional settings)
2. Switch lights off (no additional settings)
3. Movement light activated (follow-up state "Lights movement" and follow-up action "Switch lights on")
4. Movement light deactivated (follow-up state "Lights off" and follow-up action "Switch lights off")
5. Manual light activated (follow-up state "Lights manual" and follow-up action "Switch lights on")
6. Manual light deactivated (follow-up state "Lights off" and follow-up action "Switch lights off")

The list above may not seem clear to you, so please bear with me as I explain the flows I use with these. After that, I'll explain what it all does.
The flows I've made for each room are:
1. If motion sensor is armed, and it's after sundown, execute our app's action "Movement light activated" for the respective room
2. If motion sensor is disarmed, and it's after sundown, execute the action "Movement light deactivated" for the room
3. If dimmer is switched on, execute the action "Manual light activated" for the room
4. If dimmer is switched off, execute the action "Manual light deactivated" for the room
5. If we say to Homey to switch on the lights, execute the action "Manual light activated" for the room
6. If we say to Homey to switch off the lights, execute the action "Manual light deactivated" for the room

As you can see, we're still not actually switching on or off any lights! We're just connecting the app's states and actions to Homey's flows.
We will manage the actual lights in the last two flows:
7. If our app's action "Switch lights on" is requested, switch on the dimmer in the respective room
8. If our app's action "Switch lights off" is requested, switch off the dimmer in the room

More coming soon.

## Example 2: home state

Coming soon.

# To-do's
* Infinite loop detection
* Add support to execute multiple follow-up actions when an action is executed
* Make a setting for actions to specify if they're triggerable and/or performable
* Add delay settings for actions
* Add transition states and actions for states, with delays

# Revision history

2016-10-23 First commit, albeit still a work in progress. Not ready for publication or use.