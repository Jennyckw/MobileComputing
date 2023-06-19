import React, { useRef, useState, useEffect, useIsFocused } from 'react';
import { View, ScrollView, Text, Dimensions, StyleSheet, TouchableOpacity, TextInput, Button, Image, AppState, FlatList,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import ViewPropTypes from 'deprecated-react-native-prop-types';
import { PieChart } from 'react-native-svg-charts';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import CalendarInputView from './components/CalendarInputView';
import AddedView from './components/AddedView';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SCREEN_WIDTH = Dimensions.get('screen').width;

const App = () => {
    const scrollViewRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [currentMode, setCurrentMode] = useState('light');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [data, setData] = useState([10, 20]);
    const [accelerometerData, setAccelerometerData] = useState({
        x: 0,
        y: 0,
        z: 0,
    });
    const [gyroData, setGyroData] = useState({
        x: 0,
        y: 0,
        z: 0,
      });
    const [todos, setTodos] = useState([]);
    const [alcoholTodoCount, setAlcoholTodoCount] = useState(0);
    const [selectedDate, setSelectedDate] = useState(null);
    const [screenTime, setScreenTime] = useState(0);
    const [lastUpdate, setLastUpdate] = useState(Date.now());
    const [sleepTime, setSleepTime] = useState(0);
    const [isSleeping, setIsSleeping] = useState(false);
    const [lastMovement, setLastMovement] = useState(Date.now());
    const [inputValues, setInputValues] = useState([]);
    const scrollToPage = (page) => {
        const offsetX = page * SCREEN_WIDTH;
        scrollViewRef.current.scrollTo({ x: offsetX, y: 0, animated: true });
        setCurrentPage(page);
    };
    const handleDatePress = (date) => {
        setSelectedDate(date.dateString);
    };
    const toggleModal = () => {
        setIsModalVisible(!isModalVisible);
    };
    const submitData = () => {
        alert(`Height: ${height}, Weight: ${weight}, Age: ${age}, Gender: ${gender}`);
        const weightInKg = parseFloat(weight);
        const heightInCm = parseFloat(height);
        const ageInt = parseInt(age);
        const bmr =
            isNaN(weightInKg) || isNaN(heightInCm) || ['male', 'female'].indexOf(gender) === -1 || isNaN(ageInt)
                ? 0
                : gender === 'male'
                ? 10 * weightInKg + 6.25 * heightInCm - 5 * ageInt + 5
                : 10 * weightInKg + 6.25 * heightInCm - 5 * ageInt - 161;

        const movement =
            typeof accelerometerData.x === 'undefined' ||
            typeof accelerometerData.y === 'undefined' ||
            typeof accelerometerData.z === 'undefined'
                ? 0
                : Math.sqrt(
                      accelerometerData.x * accelerometerData.x +
                          accelerometerData.y * accelerometerData.y +
                          accelerometerData.z * accelerometerData.z
                  ) * weightInKg;

        // Update the chart data
        setData([bmr, movement]);
    };
    const handleTodoChange = (type, value) => {
        setTodos((prevTodos) => ({
            ...prevTodos,
            [selectedDate]: {
                ...prevTodos[selectedDate],
                [type]: value,
            },
        }));
    };
    const handleAppStateChange = (nextAppState) => {
        const now = Date.now();
        alert('nextAppState', nextAppState);
        if (nextAppState === 'active') {
            setLastUpdate(now);
        } else {
            setScreenTime(screenTime + (now - lastUpdate));
        }
    };
    useEffect(() => {
        // Enable the accelerometer
        Accelerometer.setUpdateInterval(1000); // Update every second
        Accelerometer.addListener((accelerometerData) => {
            setAccelerometerData(accelerometerData);
        });
        Gyroscope.setUpdateInterval(1000);
        Gyroscope.addListener(gyroscopeData => {
            setGyroData(gyroscopeData);
        });
        return () => {
            // Clean up the listener when the component unmounts
            Accelerometer.removeAllListeners();
            Gyroscope.removeAllListeners();
        };
    }, []);

    const intervalRef = useRef(null);

    useEffect(() => {
        const myListener = AppState.addEventListener('change', handleAppStateChange);
        return () => {
            myListener.remove();
        };
    }, [screenTime, lastUpdate]);
    useEffect(() => {
        Accelerometer.setUpdateInterval(1000);
        Accelerometer.addListener((accelerometerData) => {
            const movement = Math.sqrt(
                accelerometerData.x * accelerometerData.x +
                    accelerometerData.y * accelerometerData.y +
                    accelerometerData.z * accelerometerData.z
            );
            if (movement > 1.0) {
                // Threshold 값 임의로 설정
                setLastMovement(Date.now());
                if (isSleeping) {
                    const now = Date.now();
                    setSleepTime(sleepTime + (now - lastMovement));
                    setIsSleeping(false);
                }
            } else if (!isSleeping && Date.now() - lastMovement > 60 * 60 * 1000) {
                setIsSleeping(true);
            }
        });
        return () => {
            Accelerometer.removeAllListeners();
        };
    }, [isSleeping, sleepTime, lastMovement]);
    useEffect(() => {
        const count = todos.reduce((total, todo) => {
            const date = new Date(todo.date);
            const now = new Date();
            // Check if the todo is for the current month and is of type 'alcohol'
            if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() && todo.type === 'alcohol') {
                return total + 1;
            }
            return total;
        }, 0);
        setAlcoholTodoCount(count);
    }, [todos]);
    const lightTheme = {
        backgroundColor: 'white',
        calendarBackground: 'white',
        textSectionTitleColor: 'black',
        selectedDayBackgroundColor: '#00adf5',
        selectedDayTextColor: '#ffffff',
        todayTextColor: '#00adf5',
        dayTextColor: 'black',
        textDisabledColor: 'gray',
        dotColor: '#00adf5',
        selectedDotColor: '#ffffff',
        monthTextColor: 'skyblue',
    };
    const darkTheme = {
        ...lightTheme,
        backgroundColor: 'darkgray',
        calendarBackground: 'darkgray',
        textSectionTitleColor: 'white',
        dayTextColor: 'white',
    };
    const getImageSource = () => {
        const lightImages = {
            light_empty: require('./light_empty.png'),
            light_half: require('./light_half.png'),
            light_full: require('./light_full.png'),
        };
        const darkImages = {
            dark_empty: require('./dark_empty.png'),
            dark_half: require('./dark_half.png'),
            dark_full: require('./dark_full.png'),
        };
        if (currentMode === 'light') {
            if (alcoholTodoCount <= 10) {
                return lightImages.light_empty;
            } else if (alcoholTodoCount <= 20) {
                return lightImages.light_half;
            } else {
                return lightImages.light_full;
            }
        } else {
            if (alcoholTodoCount <= 10) {
                return darkImages.dark_empty;
            } else if (alcoholTodoCount <= 20) {
                return darkImages.dark_half;
            } else {
                return darkImages.dark_full;
            }
        }
    };

    const toggleMode = () => {
        setCurrentMode(currentMode === 'light' ? 'dark' : 'light');
    };
    const renderButtons = () => {
        return (
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    onPress={toggleMode}
                    style={[styles.button, { backgroundColor: currentMode === 'light' ? '#f2f2f2' : 'gray' }]}
                >
                    {currentMode === 'light' ? (
                        <MaterialCommunityIcons name="home" size={24} color="gray" />
                    ) : (
                        <MaterialCommunityIcons name="home" size={24} color="white" /> // 데이터 모아서 보는 창
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={toggleMode}
                    style={[styles.button, { backgroundColor: currentMode === 'light' ? '#f2f2f2' : 'gray' }]}
                >
                    {currentMode === 'light' ? (
                        <MaterialCommunityIcons name="bell" size={24} color="gray" />
                    ) : (
                        <MaterialCommunityIcons name="bell" size={24} color="white" />
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={toggleModal}
                    style={[styles.button, { backgroundColor: currentMode === 'light' ? '#f2f2f2' : 'gray' }]}
                >
                    {currentMode === 'light' ? (
                        <MaterialCommunityIcons name="pencil" size={24} color="gray" />
                    ) : (
                        <MaterialCommunityIcons name="pencil" size={24} color="white" />
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={toggleMode}
                    style={[styles.button, { backgroundColor: currentMode === 'light' ? '#f2f2f2' : 'gray' }]}
                >
                    {currentMode === 'light' ? (
                        <MaterialCommunityIcons name="weather-sunny" size={24} color="gray" />
                    ) : (
                        <MaterialCommunityIcons name="weather-night" size={24} color="white" />
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    const handleOnChange = (keyvalue, event) => {
        const { value } = event;
        setInputValues({ ...inputValues, [keyvalue]: value });
    };

    const handleAddPress = (addType, data) => {
        alert('내용이 추가되었습니다.');
        if (addType === 'alcohol') {
            setAlcoholTodoCount(alcoholTodoCount + 1);
        }
        setInputValues([{ type: addType, data }, ...inputValues]);
    };

    return (
        <View style={[styles.container, { backgroundColor: currentMode === 'light' ? 'white' : 'darkgray' }]}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                    const offsetX = event.nativeEvent.contentOffset.x;
                    const pageIndex = Math.floor(offsetX / SCREEN_WIDTH);
                    setCurrentPage(pageIndex);
                }}
            >
                {/* Page 1: Calendar UI */}
                <View style={styles.pageContainer}>
                    <View style={styles.pageContentContainer}>
                        <View style={styles.calendarContainer}>
                            <Calendar onDayPress={handleDatePress} theme={currentMode === 'light' ? lightTheme : darkTheme} />
                        </View>
                        {selectedDate && (
                            <CalendarInputView currentMode={currentMode} selectedDate={selectedDate} onAddPress={handleAddPress} />
                        )}
                        <View style={{ flex: 1, width: '100%' }}>
                            <FlatList
                                styles={styles.addedList}
                                data={inputValues}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={({ item, index }) => <AddedView inputValue={item} />}
                            />
                        </View>
                    </View>
                </View>
                {/* Page 2: Sleep pattern Content */}
                <View style={styles.pageContainer}>
                    <View style={styles.pageContentContainer}>
                        <Text style={[styles.pageText, { color: currentMode === 'light' ? 'gray' : 'white' }]}>Sleep Pattern</Text>
                        <Text>Screen Time: {Math.round(screenTime / 60 / 1000)} minutes</Text>
                        <Text>Sleep Time: {Math.round(sleepTime / 60 / 1000)} minutes</Text>
                    </View>
                </View>
                {/* Page 3: Momentum */}
                <View style={styles.pageContainer}>
                    <View style={styles.pageContentContainer}>
                        <Text style={[styles.pageText, { color: currentMode === 'light' ? 'gray' : 'white' }]}>Momentum</Text>

                        <PieChart
                            style={styles.chartStyle}
                            outerRadius={'80%'}
                            innerRadius={'50%'}
                            data={data.map((value, index) => {
                                return {
                                    key: `${index}`,
                                    value: value,
                                    svg: {
                                        fill: index === 0 ? '#87CEEB' : '#FFB6C1' 
                                    },
                                };
                            })}
                        />
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View
                                style={{ width: 10, height: 10, marginRight: 10, backgroundColor: '#FFB6C1', display: 'inline-block' }}
                            ></View>
                            <Text>BMR</Text>
                            <View
                                style={{
                                    width: 10,
                                    height: 10,
                                    marginLeft: 10,
                                    marginRight: 10,
                                    backgroundColor: '#87CEEB',
                                    display: 'inline-block',
                                }}
                            />
                            <Text>CALORIES</Text>
                        </View>
                        <View style={{ display: 'flex' }}></View>
                    </View>
                </View>
                {/* Page 4: Alcohol */}
                <View style={styles.pageContainer}>
                    <View style={styles.pageContentContainer}>
                        <Text style={[styles.pageText, { color: currentMode === 'light' ? 'gray' : 'white' }]}>Alcohol</Text>
                        <Text style={{ margin: 20 }}>Alcohol Count: {alcoholTodoCount}</Text>
                        {alcoholTodoCount > 21 && <Text style={styles.warning}>Warning: Consider reducing your alcohol consumption.</Text>}
                        <Image source={getImageSource()} style={styles.image} />
                    </View>
                </View>
                {/* Page 5: Profile */}
                <View style={styles.pageContainer}>
                    <View style={styles.pageContentContainer}>
                        <Text style={[styles.pageText, { color: currentMode === 'light' ? 'gray' : 'white' }]}>My profile</Text>
                        <Text style={[styles.label, { color: currentMode === 'light' ? 'gray' : 'white' }]}>Enter your height (cm):</Text>
                        <TextInput
                            style={[styles.input, { color: currentMode === 'light' ? 'gray' : 'white' }]}
                            onChangeText={(value) => setHeight(value)}
                            value={height}
                            keyboardType="numeric"
                        />
                        <Text style={[styles.label, { color: currentMode === 'light' ? 'gray' : 'white' }]}>Enter your weight (kg):</Text>
                        <TextInput
                            style={[styles.input, { color: currentMode === 'light' ? 'gray' : 'white' }]}
                            onChangeText={(value) => setWeight(value)}
                            value={weight}
                            keyboardType="numeric"
                        />
                        <Text style={[styles.label, { color: currentMode === 'light' ? 'gray' : 'white' }]}>Enter your age :</Text>
                        <TextInput
                            style={[styles.input, { color: currentMode === 'light' ? 'gray' : 'white' }]}
                            onChangeText={(value) => setAge(value)}
                            value={age}
                            keyboardType="numeric"
                        />
                        <Text style={[styles.label, { color: currentMode === 'light' ? 'gray' : 'white' }]}>
                            Enter your gender (male/female):
                        </Text>
                        <TextInput
                            style={[styles.input, { color: currentMode === 'light' ? 'gray' : 'white' }]}
                            onChangeText={(value) => setGender(value)}
                            value={gender}
                        />
                        <Button title="Submit" onPress={submitData} />
                    </View>
                </View>
            </ScrollView>
            {/* Add this Modal */}
            <Modal isVisible={isModalVisible}>
                <View style={styles.modalContent}>
                    <Text style={[styles.modalTitle, { color: currentMode === 'light' ? 'gray' : 'white' }]}>Today's review</Text>
                    <Button title="Close" onPress={toggleModal} />
                </View>
            </Modal>
            {/* Render buttons */}
            {renderButtons()}
        </View>
    );
};
export default App;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    pageContainer: {
        flex: 1,
        width: SCREEN_WIDTH,
    },
    pageContentContainer: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 50,
    },
    pageText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    calendarContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    addedList: {
        width: '100%',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        paddingBottom: 20,
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    chartStyle: {
        width: 200,
        height: 200,
    },
    skyBlueColor: {
        fill: '#87CEEB',
    },
    lightPinkColor: {
        fill: '#FFB6C1',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    modalTitle: {
        fontSize: 20,
        marginBottom: 12,
    },
    label: {
        fontSize: 20,
        marginVertical: 10,
    },
    input: {
        height: 40,
        width: '80%',
        borderColor: 'gray',
        borderWidth: 1,
        paddingLeft: 10,
    },
    image: {
        width: 200,
        height: 300,
    },
    warning: {},
});
