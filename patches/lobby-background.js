
        
                const i32 = (v) => v
                const f32 = i32
                const f64 = i32
                
function toInt(v) {
                    return v
                }
function toFloat(v) {
                    return v
                }
function createFloatArray(length) {
                    return new Float64Array(length)
                }
function setFloatDataView(dataView, position, value) {
                    dataView.setFloat64(position, value)
                }
function getFloatDataView(dataView, position) {
                    return dataView.getFloat64(position)
                }
let IT_FRAME = 0
let FRAME = 0
let BLOCK_SIZE = 0
let SAMPLE_RATE = 0
let NULL_SIGNAL = 0
let INPUT = createFloatArray(0)
let OUTPUT = createFloatArray(0)
const G_sked_ID_NULL = -1
const G_sked__ID_COUNTER_INIT = 1
const G_sked__MODE_WAIT = 0
const G_sked__MODE_SUBSCRIBE = 1


function G_sked_create(isLoggingEvents) {
                return {
                    eventLog: new Set(),
                    events: new Map(),
                    requests: new Map(),
                    idCounter: G_sked__ID_COUNTER_INIT,
                    isLoggingEvents,
                }
            }
function G_sked_wait(skeduler, event, callback) {
                if (skeduler.isLoggingEvents === false) {
                    throw new Error("Please activate skeduler's isLoggingEvents")
                }

                if (skeduler.eventLog.has(event)) {
                    callback(event)
                    return G_sked_ID_NULL
                } else {
                    return G_sked__createRequest(skeduler, event, callback, G_sked__MODE_WAIT)
                }
            }
function G_sked_waitFuture(skeduler, event, callback) {
                return G_sked__createRequest(skeduler, event, callback, G_sked__MODE_WAIT)
            }
function G_sked_subscribe(skeduler, event, callback) {
                return G_sked__createRequest(skeduler, event, callback, G_sked__MODE_SUBSCRIBE)
            }
function G_sked_emit(skeduler, event) {
                if (skeduler.isLoggingEvents === true) {
                    skeduler.eventLog.add(event)
                }
                if (skeduler.events.has(event)) {
                    const skedIds = skeduler.events.get(event)
                    const skedIdsStaying = []
                    for (let i = 0; i < skedIds.length; i++) {
                        if (skeduler.requests.has(skedIds[i])) {
                            const request = skeduler.requests.get(skedIds[i])
                            request.callback(event)
                            if (request.mode === G_sked__MODE_WAIT) {
                                skeduler.requests.delete(request.id)
                            } else {
                                skedIdsStaying.push(request.id)
                            }
                        }
                    }
                    skeduler.events.set(event, skedIdsStaying)
                }
            }
function G_sked_cancel(skeduler, id) {
                skeduler.requests.delete(id)
            }
function G_sked__createRequest(skeduler, event, callback, mode) {
                const id = G_sked__nextId(skeduler)
                const request = {
                    id, 
                    mode, 
                    callback,
                }
                skeduler.requests.set(id, request)
                if (!skeduler.events.has(event)) {
                    skeduler.events.set(event, [id])    
                } else {
                    skeduler.events.get(event).push(id)
                }
                return id
            }
function G_sked__nextId(skeduler) {
                return skeduler.idCounter++
            }
const G_commons__ARRAYS = new Map()
const G_commons__ARRAYS_SKEDULER = G_sked_create(false)
function G_commons_getArray(arrayName) {
            if (!G_commons__ARRAYS.has(arrayName)) {
                throw new Error('Unknown array ' + arrayName)
            }
            return G_commons__ARRAYS.get(arrayName)
        }
function G_commons_hasArray(arrayName) {
            return G_commons__ARRAYS.has(arrayName)
        }
function G_commons_setArray(arrayName, array) {
            G_commons__ARRAYS.set(arrayName, array)
            G_sked_emit(G_commons__ARRAYS_SKEDULER, arrayName)
        }
function G_commons_subscribeArrayChanges(arrayName, callback) {
            const id = G_sked_subscribe(G_commons__ARRAYS_SKEDULER, arrayName, callback)
            if (G_commons__ARRAYS.has(arrayName)) {
                callback(arrayName)
            }
            return id
        }
function G_commons_cancelArrayChangesSubscription(id) {
            G_sked_cancel(G_commons__ARRAYS_SKEDULER, id)
        }

const G_commons__FRAME_SKEDULER = G_sked_create(false)
function G_commons__emitFrame(frame) {
            G_sked_emit(G_commons__FRAME_SKEDULER, frame.toString())
        }
function G_commons_waitFrame(frame, callback) {
            return G_sked_waitFuture(G_commons__FRAME_SKEDULER, frame.toString(), callback)
        }
function G_commons_cancelWaitFrame(id) {
            G_sked_cancel(G_commons__FRAME_SKEDULER, id)
        }
const G_msg_FLOAT_TOKEN = "number"
const G_msg_STRING_TOKEN = "string"
function G_msg_create(template) {
                    const m = []
                    let i = 0
                    while (i < template.length) {
                        if (template[i] === G_msg_STRING_TOKEN) {
                            m.push('')
                            i += 2
                        } else if (template[i] === G_msg_FLOAT_TOKEN) {
                            m.push(0)
                            i += 1
                        }
                    }
                    return m
                }
function G_msg_getLength(message) {
                    return message.length
                }
function G_msg_getTokenType(message, tokenIndex) {
                    return typeof message[tokenIndex]
                }
function G_msg_isStringToken(message, tokenIndex) {
                    return G_msg_getTokenType(message, tokenIndex) === 'string'
                }
function G_msg_isFloatToken(message, tokenIndex) {
                    return G_msg_getTokenType(message, tokenIndex) === 'number'
                }
function G_msg_isMatching(message, tokenTypes) {
                    return (message.length === tokenTypes.length) 
                        && message.every((v, i) => G_msg_getTokenType(message, i) === tokenTypes[i])
                }
function G_msg_writeFloatToken(message, tokenIndex, value) {
                    message[tokenIndex] = value
                }
function G_msg_writeStringToken(message, tokenIndex, value) {
                    message[tokenIndex] = value
                }
function G_msg_readFloatToken(message, tokenIndex) {
                    return message[tokenIndex]
                }
function G_msg_readStringToken(message, tokenIndex) {
                    return message[tokenIndex]
                }
function G_msg_floats(values) {
                    return values
                }
function G_msg_strings(values) {
                    return values
                }
function G_msg_display(message) {
                    return '[' + message
                        .map(t => typeof t === 'string' ? '"' + t + '"' : t.toString())
                        .join(', ') + ']'
                }
function G_msg_VOID_MESSAGE_RECEIVER(m) {}
let G_msg_EMPTY_MESSAGE = G_msg_create([])
function G_bangUtils_isBang(message) {
            return (
                G_msg_isStringToken(message, 0) 
                && G_msg_readStringToken(message, 0) === 'bang'
            )
        }
function G_bangUtils_bang() {
            const message = G_msg_create([G_msg_STRING_TOKEN, 4])
            G_msg_writeStringToken(message, 0, 'bang')
            return message
        }
function G_bangUtils_emptyToBang(message) {
            if (G_msg_getLength(message) === 0) {
                return G_bangUtils_bang()
            } else {
                return message
            }
        }
const G_msgBuses__BUSES = new Map()
function G_msgBuses_publish(busName, message) {
            let i = 0
            const callbacks = G_msgBuses__BUSES.has(busName) ? G_msgBuses__BUSES.get(busName): []
            for (i = 0; i < callbacks.length; i++) {
                callbacks[i](message)
            }
        }
function G_msgBuses_subscribe(busName, callback) {
            if (!G_msgBuses__BUSES.has(busName)) {
                G_msgBuses__BUSES.set(busName, [])
            }
            G_msgBuses__BUSES.get(busName).push(callback)
        }
function G_msgBuses_unsubscribe(busName, callback) {
            if (!G_msgBuses__BUSES.has(busName)) {
                return
            }
            const callbacks = G_msgBuses__BUSES.get(busName)
            const found = callbacks.indexOf(callback)
            if (found !== -1) {
                callbacks.splice(found, 1)
            }
        }
function computeUnitInSamples(sampleRate, amount, unit) {
        if (unit.slice(0, 3) === 'per') {
            if (amount !== 0) {
                amount = 1 / amount
            }
            unit = unit.slice(3)
        }

        if (unit === 'msec' || unit === 'milliseconds' || unit === 'millisecond') {
            return amount / 1000 * sampleRate
        } else if (unit === 'sec' || unit === 'seconds' || unit === 'second') {
            return amount * sampleRate
        } else if (unit === 'min' || unit === 'minutes' || unit === 'minute') {
            return amount * 60 * sampleRate
        } else if (unit === 'samp' || unit === 'samples' || unit === 'sample') {
            return amount
        } else {
            throw new Error("invalid time unit : " + unit)
        }
    }
function G_actionUtils_isAction(message, action) {
            return G_msg_isMatching(message, [G_msg_STRING_TOKEN])
                && G_msg_readStringToken(message, 0) === action
        }

function G_points_interpolateLin(x, p0, p1) {
        return p0.y + (x - p0.x) * (p1.y - p0.y) / (p1.x - p0.x)
    }

function G_linesUtils_computeSlope(p0, p1) {
            return p1.x !== p0.x ? (p1.y - p0.y) / (p1.x - p0.x) : 0
        }
function G_linesUtils_removePointsBeforeFrame(points, frame) {
            const newPoints = []
            let i = 0
            while (i < points.length) {
                if (frame <= points[i].x) {
                    newPoints.push(points[i])
                }
                i++
            }
            return newPoints
        }
function G_linesUtils_insertNewLinePoints(points, p0, p1) {
            const newPoints = []
            let i = 0
            
            // Keep the points that are before the new points added
            while (i < points.length && points[i].x <= p0.x) {
                newPoints.push(points[i])
                i++
            }
            
            // Find the start value of the start point :
            
            // 1. If there is a previous point and that previous point
            // is on the same frame, we don't modify the start point value.
            // (represents a vertical line).
            if (0 < i - 1 && points[i - 1].x === p0.x) {

            // 2. If new points are inserted in between already existing points 
            // we need to interpolate the existing line to find the startValue.
            } else if (0 < i && i < points.length) {
                newPoints.push({
                    x: p0.x,
                    y: G_points_interpolateLin(p0.x, points[i - 1], points[i])
                })

            // 3. If new line is inserted after all existing points, 
            // we just take the value of the last point
            } else if (i >= points.length && points.length) {
                newPoints.push({
                    x: p0.x,
                    y: points[points.length - 1].y,
                })

            // 4. If new line placed in first position, we take the defaultStartValue.
            } else if (i === 0) {
                newPoints.push({
                    x: p0.x,
                    y: p0.y,
                })
            }
            
            newPoints.push({
                x: p1.x,
                y: p1.y,
            })
            return newPoints
        }
function G_linesUtils_computeFrameAjustedPoints(points) {
            if (points.length < 2) {
                throw new Error('invalid length for points')
            }

            const newPoints = []
            let i = 0
            let p = points[0]
            let frameLower = 0
            let frameUpper = 0
            
            while(i < points.length) {
                p = points[i]
                frameLower = Math.floor(p.x)
                frameUpper = frameLower + 1

                // I. Placing interpolated point at the lower bound of the current frame
                // ------------------------------------------------------------------------
                // 1. Point is already on an exact frame,
                if (p.x === frameLower) {
                    newPoints.push({ x: p.x, y: p.y })

                    // 1.a. if several of the next points are also on the same X,
                    // we find the last one to draw a vertical line.
                    while (
                        (i + 1) < points.length
                        && points[i + 1].x === frameLower
                    ) {
                        i++
                    }
                    if (points[i].y !== newPoints[newPoints.length - 1].y) {
                        newPoints.push({ x: points[i].x, y: points[i].y })
                    }

                    // 1.b. if last point, we quit
                    if (i + 1 >= points.length) {
                        break
                    }

                    // 1.c. if next point is in a different frame we can move on to next iteration
                    if (frameUpper <= points[i + 1].x) {
                        i++
                        continue
                    }
                
                // 2. Point isn't on an exact frame
                // 2.a. There's a previous point, the we use it to interpolate the value.
                } else if (newPoints.length) {
                    newPoints.push({
                        x: frameLower,
                        y: G_points_interpolateLin(frameLower, points[i - 1], p),
                    })
                
                // 2.b. It's the very first point, then we don't change its value.
                } else {
                    newPoints.push({ x: frameLower, y: p.y })
                }

                // II. Placing interpolated point at the upper bound of the current frame
                // ---------------------------------------------------------------------------
                // First, we find the closest point from the frame upper bound (could be the same p).
                // Or could be a point that is exactly placed on frameUpper.
                while (
                    (i + 1) < points.length 
                    && (
                        Math.ceil(points[i + 1].x) === frameUpper
                        || Math.floor(points[i + 1].x) === frameUpper
                    )
                ) {
                    i++
                }
                p = points[i]

                // 1. If the next point is directly in the next frame, 
                // we do nothing, as this corresponds with next iteration frameLower.
                if (Math.floor(p.x) === frameUpper) {
                    continue
                
                // 2. If there's still a point after p, we use it to interpolate the value
                } else if (i < points.length - 1) {
                    newPoints.push({
                        x: frameUpper,
                        y: G_points_interpolateLin(frameUpper, p, points[i + 1]),
                    })

                // 3. If it's the last point, we dont change the value
                } else {
                    newPoints.push({ x: frameUpper, y: p.y })
                }

                i++
            }

            return newPoints
        }
function G_linesUtils_computeLineSegments(points) {
            const lineSegments = []
            let i = 0
            let p0
            let p1

            while(i < points.length - 1) {
                p0 = points[i]
                p1 = points[i + 1]
                lineSegments.push({
                    p0, p1, 
                    dy: G_linesUtils_computeSlope(p0, p1),
                    dx: 1,
                })
                i++
            }
            return lineSegments
        }
function G_msgUtils_slice(message, start, end) {
            if (G_msg_getLength(message) <= start) {
                throw new Error('message empty')
            }
            const template = G_msgUtils__copyTemplate(message, start, end)
            const newMessage = G_msg_create(template)
            G_msgUtils_copy(message, newMessage, start, end, 0)
            return newMessage
        }
function G_msgUtils_concat(message1, message2) {
            const newMessage = G_msg_create(G_msgUtils__copyTemplate(message1, 0, G_msg_getLength(message1)).concat(G_msgUtils__copyTemplate(message2, 0, G_msg_getLength(message2))))
            G_msgUtils_copy(message1, newMessage, 0, G_msg_getLength(message1), 0)
            G_msgUtils_copy(message2, newMessage, 0, G_msg_getLength(message2), G_msg_getLength(message1))
            return newMessage
        }
function G_msgUtils_shift(message) {
            switch (G_msg_getLength(message)) {
                case 0:
                    throw new Error('message empty')
                case 1:
                    return G_msg_create([])
                default:
                    return G_msgUtils_slice(message, 1, G_msg_getLength(message))
            }
        }
function G_msgUtils_copy(src, dest, srcStart, srcEnd, destStart) {
            let i = srcStart
            let j = destStart
            for (i, j; i < srcEnd; i++, j++) {
                if (G_msg_getTokenType(src, i) === G_msg_STRING_TOKEN) {
                    G_msg_writeStringToken(dest, j, G_msg_readStringToken(src, i))
                } else {
                    G_msg_writeFloatToken(dest, j, G_msg_readFloatToken(src, i))
                }
            }
        }
function G_msgUtils__copyTemplate(src, start, end) {
            const template = []
            for (let i = start; i < end; i++) {
                const tokenType = G_msg_getTokenType(src, i)
                template.push(tokenType)
                if (tokenType === G_msg_STRING_TOKEN) {
                    template.push(G_msg_readStringToken(src, i).length)
                }
            }
            return template
        }
function G_funcs_mtof(value) {
        return value <= -1500 ? 0: (value > 1499 ? 3.282417553401589e+38 : Math.pow(2, (value - 69) / 12) * 440)
    }
const G_sigBuses__BUSES = new Map()
G_sigBuses__BUSES.set('', 0)
function G_sigBuses_addAssign(busName, value) {
            const newValue = G_sigBuses__BUSES.get(busName) + value
            G_sigBuses__BUSES.set(
                busName,
                newValue,
            )
            return newValue
        }
function G_sigBuses_set(busName, value) {
            G_sigBuses__BUSES.set(
                busName,
                value,
            )
        }
function G_sigBuses_reset(busName) {
            G_sigBuses__BUSES.set(busName, 0)
        }
function G_sigBuses_read(busName) {
            return G_sigBuses__BUSES.get(busName)
        }
        
function NT_tgl_setReceiveBusName(state, busName) {
            if (state.receiveBusName !== "empty") {
                G_msgBuses_unsubscribe(state.receiveBusName, state.messageReceiver)
            }
            state.receiveBusName = busName
            if (state.receiveBusName !== "empty") {
                G_msgBuses_subscribe(state.receiveBusName, state.messageReceiver)
            }
        }
function NT_tgl_setSendReceiveFromMessage(state, m) {
            if (
                G_msg_isMatching(m, [G_msg_STRING_TOKEN, G_msg_STRING_TOKEN])
                && G_msg_readStringToken(m, 0) === 'receive'
            ) {
                NT_tgl_setReceiveBusName(state, G_msg_readStringToken(m, 1))
                return true

            } else if (
                G_msg_isMatching(m, [G_msg_STRING_TOKEN, G_msg_STRING_TOKEN])
                && G_msg_readStringToken(m, 0) === 'send'
            ) {
                state.sendBusName = G_msg_readStringToken(m, 1)
                return true
            }
            return false
        }
function NT_tgl_defaultMessageHandler(m) {}
function NT_tgl_receiveMessage(state, m) {
                    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                        state.valueFloat = G_msg_readFloatToken(m, 0)
                        const outMessage = G_msg_floats([state.valueFloat])
                        state.messageSender(outMessage)
                        if (state.sendBusName !== "empty") {
                            G_msgBuses_publish(state.sendBusName, outMessage)
                        }
                        return
        
                    } else if (G_bangUtils_isBang(m)) {
                        state.valueFloat = state.valueFloat === 0 ? state.maxValue: 0
                        const outMessage = G_msg_floats([state.valueFloat])
                        state.messageSender(outMessage)
                        if (state.sendBusName !== "empty") {
                            G_msgBuses_publish(state.sendBusName, outMessage)
                        }
                        return
        
                    } else if (
                        G_msg_isMatching(m, [G_msg_STRING_TOKEN, G_msg_FLOAT_TOKEN]) 
                        && G_msg_readStringToken(m, 0) === 'set'
                    ) {
                        state.valueFloat = G_msg_readFloatToken(m, 1)
                        return
                    
                    } else if (NT_tgl_setSendReceiveFromMessage(state, m) === true) {
                        return
                    }
                }

function NT_metro_setRate(state, rate) {
                state.rate = Math.max(rate, 0)
            }
function NT_metro_scheduleNextTick(state) {
                state.snd0(G_bangUtils_bang())
                state.realNextTick = state.realNextTick + state.rate * state.sampleRatio
                state.skedId = G_commons_waitFrame(
                    toInt(Math.round(state.realNextTick)), 
                    state.tickCallback,
                )
            }
function NT_metro_stop(state) {
                if (state.skedId !== G_sked_ID_NULL) {
                    G_commons_cancelWaitFrame(state.skedId)
                    state.skedId = G_sked_ID_NULL
                }
                state.realNextTick = 0
            }

function NT_bang_setReceiveBusName(state, busName) {
            if (state.receiveBusName !== "empty") {
                G_msgBuses_unsubscribe(state.receiveBusName, state.messageReceiver)
            }
            state.receiveBusName = busName
            if (state.receiveBusName !== "empty") {
                G_msgBuses_subscribe(state.receiveBusName, state.messageReceiver)
            }
        }
function NT_bang_setSendReceiveFromMessage(state, m) {
            if (
                G_msg_isMatching(m, [G_msg_STRING_TOKEN, G_msg_STRING_TOKEN])
                && G_msg_readStringToken(m, 0) === 'receive'
            ) {
                NT_bang_setReceiveBusName(state, G_msg_readStringToken(m, 1))
                return true

            } else if (
                G_msg_isMatching(m, [G_msg_STRING_TOKEN, G_msg_STRING_TOKEN])
                && G_msg_readStringToken(m, 0) === 'send'
            ) {
                state.sendBusName = G_msg_readStringToken(m, 1)
                return true
            }
            return false
        }
function NT_bang_defaultMessageHandler(m) {}
function NT_bang_receiveMessage(state, m) {
                if (NT_bang_setSendReceiveFromMessage(state, m) === true) {
                    return
                }
                
                const outMessage = G_bangUtils_bang()
                state.messageSender(outMessage)
                if (state.sendBusName !== "empty") {
                    G_msgBuses_publish(state.sendBusName, outMessage)
                }
                return
            }



function NT_line_setNewLine(state, targetValue) {
                state.currentLine = {
                    p0: {
                        x: toFloat(FRAME), 
                        y: state.currentValue,
                    }, 
                    p1: {
                        x: toFloat(FRAME) + state.nextDurationSamp, 
                        y: targetValue,
                    }, 
                    dx: state.grainSamp
                }
                state.nextDurationSamp = 0
                state.currentLine.dy = G_linesUtils_computeSlope(state.currentLine.p0, state.currentLine.p1) * state.grainSamp
            }
function NT_line_setNextDuration(state, durationMsec) {
                state.nextDurationSamp = computeUnitInSamples(SAMPLE_RATE, durationMsec, 'msec')
            }
function NT_line_setGrain(state, grainMsec) {
                state.grainSamp = computeUnitInSamples(SAMPLE_RATE, Math.max(grainMsec, 20), 'msec')
            }
function NT_line_stopCurrentLine(state) {
                if (state.skedId !== G_sked_ID_NULL) {
                    G_commons_cancelWaitFrame(state.skedId)
                    state.skedId = G_sked_ID_NULL
                }
                if (FRAME < state.nextSampInt) {
                    NT_line_incrementTime(state, -1 * (state.nextSamp - toFloat(FRAME)))
                }
                NT_line_setNextSamp(state, -1)
            }
function NT_line_setNextSamp(state, currentSamp) {
                state.nextSamp = currentSamp
                state.nextSampInt = toInt(Math.round(currentSamp))
            }
function NT_line_incrementTime(state, incrementSamp) {
                if (incrementSamp === state.currentLine.dx) {
                    state.currentValue += state.currentLine.dy
                } else {
                    state.currentValue += G_points_interpolateLin(
                        incrementSamp,
                        {x: 0, y: 0},
                        {x: state.currentLine.dx, y: state.currentLine.dy},
                    )
                }
                NT_line_setNextSamp(
                    state, 
                    (state.nextSamp !== -1 ? state.nextSamp: toFloat(FRAME)) + incrementSamp
                )
            }
function NT_line_tick(state) {
                state.snd0(G_msg_floats([state.currentValue]))
                if (toFloat(FRAME) >= state.currentLine.p1.x) {
                    state.currentValue = state.currentLine.p1.y
                    NT_line_stopCurrentLine(state)
                } else {
                    NT_line_incrementTime(state, state.currentLine.dx)
                    NT_line_scheduleNextTick(state)
                }
            }
function NT_line_scheduleNextTick(state) {
                state.skedId = G_commons_waitFrame(state.nextSampInt, state.tickCallback)
            }

function NT_floatatom_setReceiveBusName(state, busName) {
            if (state.receiveBusName !== "empty") {
                G_msgBuses_unsubscribe(state.receiveBusName, state.messageReceiver)
            }
            state.receiveBusName = busName
            if (state.receiveBusName !== "empty") {
                G_msgBuses_subscribe(state.receiveBusName, state.messageReceiver)
            }
        }
function NT_floatatom_setSendReceiveFromMessage(state, m) {
            if (
                G_msg_isMatching(m, [G_msg_STRING_TOKEN, G_msg_STRING_TOKEN])
                && G_msg_readStringToken(m, 0) === 'receive'
            ) {
                NT_floatatom_setReceiveBusName(state, G_msg_readStringToken(m, 1))
                return true

            } else if (
                G_msg_isMatching(m, [G_msg_STRING_TOKEN, G_msg_STRING_TOKEN])
                && G_msg_readStringToken(m, 0) === 'send'
            ) {
                state.sendBusName = G_msg_readStringToken(m, 1)
                return true
            }
            return false
        }
function NT_floatatom_defaultMessageHandler(m) {}
function NT_floatatom_receiveMessage(state, m) {
                    if (G_bangUtils_isBang(m)) {
                        state.messageSender(state.value)
                        if (state.sendBusName !== "empty") {
                            G_msgBuses_publish(state.sendBusName, state.value)
                        }
                        return
                    
                    } else if (
                        G_msg_getTokenType(m, 0) === G_msg_STRING_TOKEN
                        && G_msg_readStringToken(m, 0) === 'set'
                    ) {
                        const setMessage = G_msgUtils_slice(m, 1, G_msg_getLength(m))
                        if (G_msg_isMatching(setMessage, [G_msg_FLOAT_TOKEN])) { 
                                state.value = setMessage    
                                return
                        }
        
                    } else if (NT_floatatom_setSendReceiveFromMessage(state, m) === true) {
                        return
                        
                    } else if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                    
                        state.value = m
                        state.messageSender(state.value)
                        if (state.sendBusName !== "empty") {
                            G_msgBuses_publish(state.sendBusName, state.value)
                        }
                        return
        
                    }
                }







function NT_delay_setDelay(state, delay) {
                state.delay = Math.max(0, delay)
            }
function NT_delay_scheduleDelay(state, callback, currentFrame) {
                if (state.scheduledBang !== G_sked_ID_NULL) {
                    NT_delay_stop(state)
                }
                state.scheduledBang = G_commons_waitFrame(toInt(
                    Math.round(
                        toFloat(currentFrame) + state.delay * state.sampleRatio)),
                    callback
                )
            }
function NT_delay_stop(state) {
                G_commons_cancelWaitFrame(state.scheduledBang)
                state.scheduledBang = G_sked_ID_NULL
            }





function NT_phasor_t_setStep(state, freq) {
                    state.step = (1 / SAMPLE_RATE) * freq
                }
function NT_phasor_t_setPhase(state, phase) {
                    state.phase = phase % 1.0 * 1
                }

function NT_lop_t_setFreq(state, freq) {
                state.coeff = Math.max(Math.min(freq * 2 * Math.PI / SAMPLE_RATE, 1), 0)
            }



function NT_throw_t_setBusName(state, busName) {
            if (busName.length) {
                state.busName = busName
                G_sigBuses_reset(state.busName)
            }
        }

function NT_catch_t_setBusName(state, busName) {
            if (busName.length) {
                state.busName = busName
                G_sigBuses_reset(state.busName)
            }
        }



        const N_n_0_0_state = {
                                minValue: 0,
maxValue: 1,
valueFloat: 0,
value: G_msg_create([]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_tgl_defaultMessageHandler,
messageSender: NT_tgl_defaultMessageHandler,
                            }
const N_n_0_52_state = {
                                rate: 0,
sampleRatio: 1,
skedId: G_sked_ID_NULL,
realNextTick: -1,
snd0: function (m) {},
tickCallback: function () {},
                            }
const N_n_0_1_state = {
                                value: G_msg_create([]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_bang_defaultMessageHandler,
messageSender: NT_bang_defaultMessageHandler,
                            }
const N_n_0_7_state = {
                                msgSpecs: [],
                            }
const N_n_0_8_state = {
                                currentLine: {
                p0: {x: -1, y: 0},
                p1: {x: -1, y: 0},
                dx: 1,
                dy: 0,
            },
currentValue: 0,
nextSamp: -1,
nextSampInt: -1,
grainSamp: 0,
nextDurationSamp: 0,
skedId: G_sked_ID_NULL,
snd0: function (m) {},
tickCallback: function () {},
                            }
const N_n_0_9_state = {
                                value: G_msg_floats([0]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_floatatom_defaultMessageHandler,
messageSender: NT_floatatom_defaultMessageHandler,
                            }
const N_m_n_0_10_1_sig_state = {
                                currentValue: 0,
                            }
const N_n_0_57_state = {
                                delay: 0,
sampleRatio: 1,
scheduledBang: G_sked_ID_NULL,
                            }
const N_n_0_65_state = {
                                msgSpecs: [],
                            }
const N_n_0_4_state = {
                                value: G_msg_floats([0]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_floatatom_defaultMessageHandler,
messageSender: NT_floatatom_defaultMessageHandler,
                            }
const N_n_0_6_state = {
                                value: G_msg_floats([0]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_floatatom_defaultMessageHandler,
messageSender: NT_floatatom_defaultMessageHandler,
                            }
const N_m_n_0_2_0_sig_state = {
                                currentValue: 0,
                            }
const N_n_0_13_state = {
                                minValue: 0,
maxValue: 1,
valueFloat: 0,
value: G_msg_create([]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_tgl_defaultMessageHandler,
messageSender: NT_tgl_defaultMessageHandler,
                            }
const N_n_0_53_state = {
                                rate: 0,
sampleRatio: 1,
skedId: G_sked_ID_NULL,
realNextTick: -1,
snd0: function (m) {},
tickCallback: function () {},
                            }
const N_n_0_14_state = {
                                value: G_msg_create([]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_bang_defaultMessageHandler,
messageSender: NT_bang_defaultMessageHandler,
                            }
const N_n_0_20_state = {
                                msgSpecs: [],
                            }
const N_n_0_21_state = {
                                currentLine: {
                p0: {x: -1, y: 0},
                p1: {x: -1, y: 0},
                dx: 1,
                dy: 0,
            },
currentValue: 0,
nextSamp: -1,
nextSampInt: -1,
grainSamp: 0,
nextDurationSamp: 0,
skedId: G_sked_ID_NULL,
snd0: function (m) {},
tickCallback: function () {},
                            }
const N_n_0_22_state = {
                                value: G_msg_floats([0]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_floatatom_defaultMessageHandler,
messageSender: NT_floatatom_defaultMessageHandler,
                            }
const N_m_n_0_23_1_sig_state = {
                                currentValue: 0,
                            }
const N_n_0_58_state = {
                                delay: 0,
sampleRatio: 1,
scheduledBang: G_sked_ID_NULL,
                            }
const N_n_0_66_state = {
                                msgSpecs: [],
                            }
const N_n_0_17_state = {
                                value: G_msg_floats([0]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_floatatom_defaultMessageHandler,
messageSender: NT_floatatom_defaultMessageHandler,
                            }
const N_n_0_19_state = {
                                value: G_msg_floats([0]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_floatatom_defaultMessageHandler,
messageSender: NT_floatatom_defaultMessageHandler,
                            }
const N_m_n_0_15_0_sig_state = {
                                currentValue: 0,
                            }
const N_n_0_25_state = {
                                value: G_msg_floats([0]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_floatatom_defaultMessageHandler,
messageSender: NT_floatatom_defaultMessageHandler,
                            }
const N_n_0_26_state = {
                                minValue: 0,
maxValue: 1,
valueFloat: 0,
value: G_msg_create([]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_tgl_defaultMessageHandler,
messageSender: NT_tgl_defaultMessageHandler,
                            }
const N_n_0_54_state = {
                                rate: 0,
sampleRatio: 1,
skedId: G_sked_ID_NULL,
realNextTick: -1,
snd0: function (m) {},
tickCallback: function () {},
                            }
const N_n_0_27_state = {
                                value: G_msg_create([]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_bang_defaultMessageHandler,
messageSender: NT_bang_defaultMessageHandler,
                            }
const N_n_0_33_state = {
                                msgSpecs: [],
                            }
const N_n_0_34_state = {
                                currentLine: {
                p0: {x: -1, y: 0},
                p1: {x: -1, y: 0},
                dx: 1,
                dy: 0,
            },
currentValue: 0,
nextSamp: -1,
nextSampInt: -1,
grainSamp: 0,
nextDurationSamp: 0,
skedId: G_sked_ID_NULL,
snd0: function (m) {},
tickCallback: function () {},
                            }
const N_n_0_35_state = {
                                value: G_msg_floats([0]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_floatatom_defaultMessageHandler,
messageSender: NT_floatatom_defaultMessageHandler,
                            }
const N_m_n_0_36_1_sig_state = {
                                currentValue: 0,
                            }
const N_n_0_59_state = {
                                delay: 0,
sampleRatio: 1,
scheduledBang: G_sked_ID_NULL,
                            }
const N_n_0_67_state = {
                                msgSpecs: [],
                            }
const N_n_0_30_state = {
                                value: G_msg_floats([0]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_floatatom_defaultMessageHandler,
messageSender: NT_floatatom_defaultMessageHandler,
                            }
const N_n_0_32_state = {
                                value: G_msg_floats([0]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_floatatom_defaultMessageHandler,
messageSender: NT_floatatom_defaultMessageHandler,
                            }
const N_m_n_0_28_0_sig_state = {
                                currentValue: 0,
                            }
const N_n_0_38_state = {
                                value: G_msg_floats([0]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_floatatom_defaultMessageHandler,
messageSender: NT_floatatom_defaultMessageHandler,
                            }
const N_n_0_39_state = {
                                minValue: 0,
maxValue: 1,
valueFloat: 0,
value: G_msg_create([]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_tgl_defaultMessageHandler,
messageSender: NT_tgl_defaultMessageHandler,
                            }
const N_n_0_55_state = {
                                rate: 0,
sampleRatio: 1,
skedId: G_sked_ID_NULL,
realNextTick: -1,
snd0: function (m) {},
tickCallback: function () {},
                            }
const N_n_0_40_state = {
                                value: G_msg_create([]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_bang_defaultMessageHandler,
messageSender: NT_bang_defaultMessageHandler,
                            }
const N_n_0_46_state = {
                                msgSpecs: [],
                            }
const N_n_0_47_state = {
                                currentLine: {
                p0: {x: -1, y: 0},
                p1: {x: -1, y: 0},
                dx: 1,
                dy: 0,
            },
currentValue: 0,
nextSamp: -1,
nextSampInt: -1,
grainSamp: 0,
nextDurationSamp: 0,
skedId: G_sked_ID_NULL,
snd0: function (m) {},
tickCallback: function () {},
                            }
const N_n_0_48_state = {
                                value: G_msg_floats([0]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_floatatom_defaultMessageHandler,
messageSender: NT_floatatom_defaultMessageHandler,
                            }
const N_m_n_0_49_1_sig_state = {
                                currentValue: 0,
                            }
const N_n_0_60_state = {
                                delay: 0,
sampleRatio: 1,
scheduledBang: G_sked_ID_NULL,
                            }
const N_n_0_68_state = {
                                msgSpecs: [],
                            }
const N_n_0_43_state = {
                                value: G_msg_floats([0]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_floatatom_defaultMessageHandler,
messageSender: NT_floatatom_defaultMessageHandler,
                            }
const N_n_0_45_state = {
                                value: G_msg_floats([0]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_floatatom_defaultMessageHandler,
messageSender: NT_floatatom_defaultMessageHandler,
                            }
const N_m_n_0_41_0_sig_state = {
                                currentValue: 0,
                            }
const N_n_0_51_state = {
                                value: G_msg_floats([0]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_floatatom_defaultMessageHandler,
messageSender: NT_floatatom_defaultMessageHandler,
                            }
const N_n_0_56_state = {
                                value: G_msg_floats([0]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_floatatom_defaultMessageHandler,
messageSender: NT_floatatom_defaultMessageHandler,
                            }
const N_n_0_61_state = {
                                value: G_msg_floats([0]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_floatatom_defaultMessageHandler,
messageSender: NT_floatatom_defaultMessageHandler,
                            }
const N_n_0_62_state = {
                                value: G_msg_floats([0]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_floatatom_defaultMessageHandler,
messageSender: NT_floatatom_defaultMessageHandler,
                            }
const N_n_0_63_state = {
                                value: G_msg_floats([0]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_floatatom_defaultMessageHandler,
messageSender: NT_floatatom_defaultMessageHandler,
                            }
const N_n_0_64_state = {
                                value: G_msg_floats([0]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_floatatom_defaultMessageHandler,
messageSender: NT_floatatom_defaultMessageHandler,
                            }
const N_n_0_2_state = {
                                phase: 0,
step: 0,
                            }
const N_m_n_0_3_1_sig_state = {
                                currentValue: 6000,
                            }
const N_n_0_3_state = {
                                previous: 0,
coeff: 0,
                            }
const N_n_0_11_state = {
                                busName: "",
                            }
const N_n_0_15_state = {
                                phase: 0,
step: 0,
                            }
const N_m_n_0_16_1_sig_state = {
                                currentValue: 6000,
                            }
const N_n_0_16_state = {
                                previous: 0,
coeff: 0,
                            }
const N_n_0_24_state = {
                                busName: "",
                            }
const N_n_0_28_state = {
                                phase: 0,
step: 0,
                            }
const N_m_n_0_29_1_sig_state = {
                                currentValue: 6000,
                            }
const N_n_0_29_state = {
                                previous: 0,
coeff: 0,
                            }
const N_n_0_37_state = {
                                busName: "",
                            }
const N_n_0_41_state = {
                                phase: 0,
step: 0,
                            }
const N_m_n_0_42_1_sig_state = {
                                currentValue: 6000,
                            }
const N_n_0_42_state = {
                                previous: 0,
coeff: 0,
                            }
const N_n_0_50_state = {
                                busName: "",
                            }
const N_n_0_12_state = {
                                busName: "",
                            }
const N_m_n_0_70_1_sig_state = {
                                currentValue: 4500,
                            }
const N_n_0_70_state = {
                                previous: 0,
coeff: 0,
                            }
const N_m_n_0_71_1_sig_state = {
                                currentValue: 0.13,
                            }
        
function N_n_0_0_rcvs_0(m) {
                            
                NT_tgl_receiveMessage(N_n_0_0_state, m)
                return
            
                            throw new Error('Node "n_0_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_52_rcvs_0(m) {
                            
            if (G_msg_getLength(m) === 1) {
                if (
                    (G_msg_isFloatToken(m, 0) && G_msg_readFloatToken(m, 0) === 0)
                    || G_actionUtils_isAction(m, 'stop')
                ) {
                    NT_metro_stop(N_n_0_52_state)
                    return
    
                } else if (
                    G_msg_isFloatToken(m, 0)
                    || G_bangUtils_isBang(m)
                ) {
                    N_n_0_52_state.realNextTick = toFloat(FRAME)
                    NT_metro_scheduleNextTick(N_n_0_52_state)
                    return
                }
            }
        
                            throw new Error('Node "n_0_52", inlet "0", unsupported message : ' + G_msg_display(m))
                        }
function N_n_0_52_rcvs_1(m) {
                            
    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
        NT_metro_setRate(N_n_0_52_state, G_msg_readFloatToken(m, 0))
        return
    }

                            throw new Error('Node "n_0_52", inlet "1", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_1_rcvs_0(m) {
                            
            NT_bang_receiveMessage(N_n_0_1_state, m)
            return
        
                            throw new Error('Node "n_0_1", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_7_rcvs_0(m) {
                            
                if (
                    G_msg_isStringToken(m, 0) 
                    && G_msg_readStringToken(m, 0) === 'set'
                ) {
                    const outTemplate = []
                    for (let i = 1; i < G_msg_getLength(m); i++) {
                        if (G_msg_isFloatToken(m, i)) {
                            outTemplate.push(G_msg_FLOAT_TOKEN)
                        } else {
                            outTemplate.push(G_msg_STRING_TOKEN)
                            outTemplate.push(G_msg_readStringToken(m, i).length)
                        }
                    }

                    const outMessage = G_msg_create(outTemplate)
                    for (let i = 1; i < G_msg_getLength(m); i++) {
                        if (G_msg_isFloatToken(m, i)) {
                            G_msg_writeFloatToken(
                                outMessage, i - 1, G_msg_readFloatToken(m, i)
                            )
                        } else {
                            G_msg_writeStringToken(
                                outMessage, i - 1, G_msg_readStringToken(m, i)
                            )
                        }
                    }

                    N_n_0_7_state.msgSpecs.splice(0, N_n_0_7_state.msgSpecs.length - 1)
                    N_n_0_7_state.msgSpecs[0] = {
                        transferFunction: function (m) {
                            return N_n_0_7_state.msgSpecs[0].outMessage
                        },
                        outTemplate: outTemplate,
                        outMessage: outMessage,
                        send: "",
                        hasSend: false,
                    }
                    return
    
                } else {
                    for (let i = 0; i < N_n_0_7_state.msgSpecs.length; i++) {
                        if (N_n_0_7_state.msgSpecs[i].hasSend) {
                            G_msgBuses_publish(N_n_0_7_state.msgSpecs[i].send, N_n_0_7_state.msgSpecs[i].transferFunction(m))
                        } else {
                            N_n_0_7_snds_0(N_n_0_7_state.msgSpecs[i].transferFunction(m))
                        }
                    }
                    return
                }
            
                            throw new Error('Node "n_0_7", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_8_rcvs_0(m) {
                            
            if (
                G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])
                || G_msg_isMatching(m, [G_msg_FLOAT_TOKEN, G_msg_FLOAT_TOKEN])
                || G_msg_isMatching(m, [G_msg_FLOAT_TOKEN, G_msg_FLOAT_TOKEN, G_msg_FLOAT_TOKEN])
            ) {
                NT_line_stopCurrentLine(N_n_0_8_state)
                switch (G_msg_getLength(m)) {
                    case 3:
                        NT_line_setGrain(N_n_0_8_state, G_msg_readFloatToken(m, 2))
                    case 2:
                        NT_line_setNextDuration(N_n_0_8_state, G_msg_readFloatToken(m, 1))
                    case 1:
                        const targetValue = G_msg_readFloatToken(m, 0)
                        if (N_n_0_8_state.nextDurationSamp === 0) {
                            N_n_0_8_state.currentValue = targetValue
                            N_n_0_9_rcvs_0(G_msg_floats([targetValue]))
                        } else {
                            N_n_0_9_rcvs_0(G_msg_floats([N_n_0_8_state.currentValue]))
                            NT_line_setNewLine(N_n_0_8_state, targetValue)
                            NT_line_incrementTime(N_n_0_8_state, N_n_0_8_state.currentLine.dx)
                            NT_line_scheduleNextTick(N_n_0_8_state)
                        }
                        
                }
                return
    
            } else if (G_actionUtils_isAction(m, 'stop')) {
                NT_line_stopCurrentLine(N_n_0_8_state)
                return
    
            } else if (
                G_msg_isMatching(m, [G_msg_STRING_TOKEN, G_msg_FLOAT_TOKEN])
                && G_msg_readStringToken(m, 0) === 'set'
            ) {
                NT_line_stopCurrentLine(N_n_0_8_state)
                N_n_0_8_state.currentValue = G_msg_readFloatToken(m, 1)
                return
            }
        
                            throw new Error('Node "n_0_8", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_9_rcvs_0(m) {
                            
                NT_floatatom_receiveMessage(N_n_0_9_state, m)
                return
            
                            throw new Error('Node "n_0_9", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_m_n_0_10_1__routemsg_rcvs_0(m) {
                            
            if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                N_m_n_0_10_1_sig_rcvs_0(m)
                return
            } else {
                G_msg_VOID_MESSAGE_RECEIVER(m)
                return
            }
        
                            throw new Error('Node "m_n_0_10_1__routemsg", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_m_n_0_10_1_sig_rcvs_0(m) {
                            
    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
        N_m_n_0_10_1_sig_state.currentValue = G_msg_readFloatToken(m, 0)
        return
    }

                            throw new Error('Node "m_n_0_10_1_sig", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_9_0_rcvs_0(m) {
                            
                IO_snd_n_0_9_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_9_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_7_0_rcvs_0(m) {
                            
                IO_snd_n_0_7_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_7_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_57_rcvs_0(m) {
                            
            if (G_msg_getLength(m) === 1) {
                if (G_msg_isStringToken(m, 0)) {
                    const action = G_msg_readStringToken(m, 0)
                    if (action === 'bang' || action === 'start') {
                        NT_delay_scheduleDelay(
                            N_n_0_57_state, 
                            () => N_n_0_65_rcvs_0(G_bangUtils_bang()),
                            FRAME,
                        )
                        return
                    } else if (action === 'stop') {
                        NT_delay_stop(N_n_0_57_state)
                        return
                    }
                    
                } else if (G_msg_isFloatToken(m, 0)) {
                    NT_delay_setDelay(N_n_0_57_state, G_msg_readFloatToken(m, 0))
                    NT_delay_scheduleDelay(
                        N_n_0_57_state,
                        () => N_n_0_65_rcvs_0(G_bangUtils_bang()),
                        FRAME,
                    )
                    return 
                }
            
            } else if (
                G_msg_isMatching(m, [G_msg_STRING_TOKEN, G_msg_FLOAT_TOKEN, G_msg_STRING_TOKEN])
                && G_msg_readStringToken(m, 0) === 'tempo'
            ) {
                N_n_0_57_state.sampleRatio = computeUnitInSamples(
                    SAMPLE_RATE, 
                    G_msg_readFloatToken(m, 1), 
                    G_msg_readStringToken(m, 2)
                )
                return
            }
        
                            throw new Error('Node "n_0_57", inlet "0", unsupported message : ' + G_msg_display(m))
                        }
function N_n_0_57_rcvs_1(m) {
                            
    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
        NT_delay_setDelay(N_n_0_57_state, G_msg_readFloatToken(m, 0))
        return
    }

                            throw new Error('Node "n_0_57", inlet "1", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_65_rcvs_0(m) {
                            
                if (
                    G_msg_isStringToken(m, 0) 
                    && G_msg_readStringToken(m, 0) === 'set'
                ) {
                    const outTemplate = []
                    for (let i = 1; i < G_msg_getLength(m); i++) {
                        if (G_msg_isFloatToken(m, i)) {
                            outTemplate.push(G_msg_FLOAT_TOKEN)
                        } else {
                            outTemplate.push(G_msg_STRING_TOKEN)
                            outTemplate.push(G_msg_readStringToken(m, i).length)
                        }
                    }

                    const outMessage = G_msg_create(outTemplate)
                    for (let i = 1; i < G_msg_getLength(m); i++) {
                        if (G_msg_isFloatToken(m, i)) {
                            G_msg_writeFloatToken(
                                outMessage, i - 1, G_msg_readFloatToken(m, i)
                            )
                        } else {
                            G_msg_writeStringToken(
                                outMessage, i - 1, G_msg_readStringToken(m, i)
                            )
                        }
                    }

                    N_n_0_65_state.msgSpecs.splice(0, N_n_0_65_state.msgSpecs.length - 1)
                    N_n_0_65_state.msgSpecs[0] = {
                        transferFunction: function (m) {
                            return N_n_0_65_state.msgSpecs[0].outMessage
                        },
                        outTemplate: outTemplate,
                        outMessage: outMessage,
                        send: "",
                        hasSend: false,
                    }
                    return
    
                } else {
                    for (let i = 0; i < N_n_0_65_state.msgSpecs.length; i++) {
                        if (N_n_0_65_state.msgSpecs[i].hasSend) {
                            G_msgBuses_publish(N_n_0_65_state.msgSpecs[i].send, N_n_0_65_state.msgSpecs[i].transferFunction(m))
                        } else {
                            N_n_0_65_snds_0(N_n_0_65_state.msgSpecs[i].transferFunction(m))
                        }
                    }
                    return
                }
            
                            throw new Error('Node "n_0_65", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_65_0_rcvs_0(m) {
                            
                IO_snd_n_0_65_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_65_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_1_0_rcvs_0(m) {
                            
                IO_snd_n_0_1_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_1_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_0_0_rcvs_0(m) {
                            
                IO_snd_n_0_0_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_0_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_4_rcvs_0(m) {
                            
                NT_floatatom_receiveMessage(N_n_0_4_state, m)
                return
            
                            throw new Error('Node "n_0_4", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_5_rcvs_0(m) {
                            
                    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                        const value = G_msg_readFloatToken(m, 0)
                        N_n_0_6_rcvs_0(G_msg_floats([G_funcs_mtof(value)]))
                        return
                    }
                
                            throw new Error('Node "n_0_5", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_6_rcvs_0(m) {
                            
                NT_floatatom_receiveMessage(N_n_0_6_state, m)
                return
            
                            throw new Error('Node "n_0_6", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_m_n_0_2_0__routemsg_rcvs_0(m) {
                            
            if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                N_m_n_0_2_0__routemsg_snds_0(m)
                return
            } else {
                G_msg_VOID_MESSAGE_RECEIVER(m)
                return
            }
        
                            throw new Error('Node "m_n_0_2_0__routemsg", inlet "0", unsupported message : ' + G_msg_display(m))
                        }
let N_m_n_0_2_0_sig_outs_0 = 0
function N_m_n_0_2_0_sig_rcvs_0(m) {
                            
    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
        N_m_n_0_2_0_sig_state.currentValue = G_msg_readFloatToken(m, 0)
        return
    }

                            throw new Error('Node "m_n_0_2_0_sig", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_6_0_rcvs_0(m) {
                            
                IO_snd_n_0_6_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_6_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_4_0_rcvs_0(m) {
                            
                IO_snd_n_0_4_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_4_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_13_rcvs_0(m) {
                            
                NT_tgl_receiveMessage(N_n_0_13_state, m)
                return
            
                            throw new Error('Node "n_0_13", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_53_rcvs_0(m) {
                            
            if (G_msg_getLength(m) === 1) {
                if (
                    (G_msg_isFloatToken(m, 0) && G_msg_readFloatToken(m, 0) === 0)
                    || G_actionUtils_isAction(m, 'stop')
                ) {
                    NT_metro_stop(N_n_0_53_state)
                    return
    
                } else if (
                    G_msg_isFloatToken(m, 0)
                    || G_bangUtils_isBang(m)
                ) {
                    N_n_0_53_state.realNextTick = toFloat(FRAME)
                    NT_metro_scheduleNextTick(N_n_0_53_state)
                    return
                }
            }
        
                            throw new Error('Node "n_0_53", inlet "0", unsupported message : ' + G_msg_display(m))
                        }
function N_n_0_53_rcvs_1(m) {
                            
    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
        NT_metro_setRate(N_n_0_53_state, G_msg_readFloatToken(m, 0))
        return
    }

                            throw new Error('Node "n_0_53", inlet "1", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_14_rcvs_0(m) {
                            
            NT_bang_receiveMessage(N_n_0_14_state, m)
            return
        
                            throw new Error('Node "n_0_14", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_20_rcvs_0(m) {
                            
                if (
                    G_msg_isStringToken(m, 0) 
                    && G_msg_readStringToken(m, 0) === 'set'
                ) {
                    const outTemplate = []
                    for (let i = 1; i < G_msg_getLength(m); i++) {
                        if (G_msg_isFloatToken(m, i)) {
                            outTemplate.push(G_msg_FLOAT_TOKEN)
                        } else {
                            outTemplate.push(G_msg_STRING_TOKEN)
                            outTemplate.push(G_msg_readStringToken(m, i).length)
                        }
                    }

                    const outMessage = G_msg_create(outTemplate)
                    for (let i = 1; i < G_msg_getLength(m); i++) {
                        if (G_msg_isFloatToken(m, i)) {
                            G_msg_writeFloatToken(
                                outMessage, i - 1, G_msg_readFloatToken(m, i)
                            )
                        } else {
                            G_msg_writeStringToken(
                                outMessage, i - 1, G_msg_readStringToken(m, i)
                            )
                        }
                    }

                    N_n_0_20_state.msgSpecs.splice(0, N_n_0_20_state.msgSpecs.length - 1)
                    N_n_0_20_state.msgSpecs[0] = {
                        transferFunction: function (m) {
                            return N_n_0_20_state.msgSpecs[0].outMessage
                        },
                        outTemplate: outTemplate,
                        outMessage: outMessage,
                        send: "",
                        hasSend: false,
                    }
                    return
    
                } else {
                    for (let i = 0; i < N_n_0_20_state.msgSpecs.length; i++) {
                        if (N_n_0_20_state.msgSpecs[i].hasSend) {
                            G_msgBuses_publish(N_n_0_20_state.msgSpecs[i].send, N_n_0_20_state.msgSpecs[i].transferFunction(m))
                        } else {
                            N_n_0_20_snds_0(N_n_0_20_state.msgSpecs[i].transferFunction(m))
                        }
                    }
                    return
                }
            
                            throw new Error('Node "n_0_20", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_21_rcvs_0(m) {
                            
            if (
                G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])
                || G_msg_isMatching(m, [G_msg_FLOAT_TOKEN, G_msg_FLOAT_TOKEN])
                || G_msg_isMatching(m, [G_msg_FLOAT_TOKEN, G_msg_FLOAT_TOKEN, G_msg_FLOAT_TOKEN])
            ) {
                NT_line_stopCurrentLine(N_n_0_21_state)
                switch (G_msg_getLength(m)) {
                    case 3:
                        NT_line_setGrain(N_n_0_21_state, G_msg_readFloatToken(m, 2))
                    case 2:
                        NT_line_setNextDuration(N_n_0_21_state, G_msg_readFloatToken(m, 1))
                    case 1:
                        const targetValue = G_msg_readFloatToken(m, 0)
                        if (N_n_0_21_state.nextDurationSamp === 0) {
                            N_n_0_21_state.currentValue = targetValue
                            N_n_0_22_rcvs_0(G_msg_floats([targetValue]))
                        } else {
                            N_n_0_22_rcvs_0(G_msg_floats([N_n_0_21_state.currentValue]))
                            NT_line_setNewLine(N_n_0_21_state, targetValue)
                            NT_line_incrementTime(N_n_0_21_state, N_n_0_21_state.currentLine.dx)
                            NT_line_scheduleNextTick(N_n_0_21_state)
                        }
                        
                }
                return
    
            } else if (G_actionUtils_isAction(m, 'stop')) {
                NT_line_stopCurrentLine(N_n_0_21_state)
                return
    
            } else if (
                G_msg_isMatching(m, [G_msg_STRING_TOKEN, G_msg_FLOAT_TOKEN])
                && G_msg_readStringToken(m, 0) === 'set'
            ) {
                NT_line_stopCurrentLine(N_n_0_21_state)
                N_n_0_21_state.currentValue = G_msg_readFloatToken(m, 1)
                return
            }
        
                            throw new Error('Node "n_0_21", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_22_rcvs_0(m) {
                            
                NT_floatatom_receiveMessage(N_n_0_22_state, m)
                return
            
                            throw new Error('Node "n_0_22", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_m_n_0_23_1__routemsg_rcvs_0(m) {
                            
            if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                N_m_n_0_23_1_sig_rcvs_0(m)
                return
            } else {
                G_msg_VOID_MESSAGE_RECEIVER(m)
                return
            }
        
                            throw new Error('Node "m_n_0_23_1__routemsg", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_m_n_0_23_1_sig_rcvs_0(m) {
                            
    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
        N_m_n_0_23_1_sig_state.currentValue = G_msg_readFloatToken(m, 0)
        return
    }

                            throw new Error('Node "m_n_0_23_1_sig", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_22_0_rcvs_0(m) {
                            
                IO_snd_n_0_22_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_22_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_20_0_rcvs_0(m) {
                            
                IO_snd_n_0_20_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_20_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_58_rcvs_0(m) {
                            
            if (G_msg_getLength(m) === 1) {
                if (G_msg_isStringToken(m, 0)) {
                    const action = G_msg_readStringToken(m, 0)
                    if (action === 'bang' || action === 'start') {
                        NT_delay_scheduleDelay(
                            N_n_0_58_state, 
                            () => N_n_0_66_rcvs_0(G_bangUtils_bang()),
                            FRAME,
                        )
                        return
                    } else if (action === 'stop') {
                        NT_delay_stop(N_n_0_58_state)
                        return
                    }
                    
                } else if (G_msg_isFloatToken(m, 0)) {
                    NT_delay_setDelay(N_n_0_58_state, G_msg_readFloatToken(m, 0))
                    NT_delay_scheduleDelay(
                        N_n_0_58_state,
                        () => N_n_0_66_rcvs_0(G_bangUtils_bang()),
                        FRAME,
                    )
                    return 
                }
            
            } else if (
                G_msg_isMatching(m, [G_msg_STRING_TOKEN, G_msg_FLOAT_TOKEN, G_msg_STRING_TOKEN])
                && G_msg_readStringToken(m, 0) === 'tempo'
            ) {
                N_n_0_58_state.sampleRatio = computeUnitInSamples(
                    SAMPLE_RATE, 
                    G_msg_readFloatToken(m, 1), 
                    G_msg_readStringToken(m, 2)
                )
                return
            }
        
                            throw new Error('Node "n_0_58", inlet "0", unsupported message : ' + G_msg_display(m))
                        }
function N_n_0_58_rcvs_1(m) {
                            
    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
        NT_delay_setDelay(N_n_0_58_state, G_msg_readFloatToken(m, 0))
        return
    }

                            throw new Error('Node "n_0_58", inlet "1", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_66_rcvs_0(m) {
                            
                if (
                    G_msg_isStringToken(m, 0) 
                    && G_msg_readStringToken(m, 0) === 'set'
                ) {
                    const outTemplate = []
                    for (let i = 1; i < G_msg_getLength(m); i++) {
                        if (G_msg_isFloatToken(m, i)) {
                            outTemplate.push(G_msg_FLOAT_TOKEN)
                        } else {
                            outTemplate.push(G_msg_STRING_TOKEN)
                            outTemplate.push(G_msg_readStringToken(m, i).length)
                        }
                    }

                    const outMessage = G_msg_create(outTemplate)
                    for (let i = 1; i < G_msg_getLength(m); i++) {
                        if (G_msg_isFloatToken(m, i)) {
                            G_msg_writeFloatToken(
                                outMessage, i - 1, G_msg_readFloatToken(m, i)
                            )
                        } else {
                            G_msg_writeStringToken(
                                outMessage, i - 1, G_msg_readStringToken(m, i)
                            )
                        }
                    }

                    N_n_0_66_state.msgSpecs.splice(0, N_n_0_66_state.msgSpecs.length - 1)
                    N_n_0_66_state.msgSpecs[0] = {
                        transferFunction: function (m) {
                            return N_n_0_66_state.msgSpecs[0].outMessage
                        },
                        outTemplate: outTemplate,
                        outMessage: outMessage,
                        send: "",
                        hasSend: false,
                    }
                    return
    
                } else {
                    for (let i = 0; i < N_n_0_66_state.msgSpecs.length; i++) {
                        if (N_n_0_66_state.msgSpecs[i].hasSend) {
                            G_msgBuses_publish(N_n_0_66_state.msgSpecs[i].send, N_n_0_66_state.msgSpecs[i].transferFunction(m))
                        } else {
                            N_n_0_66_snds_0(N_n_0_66_state.msgSpecs[i].transferFunction(m))
                        }
                    }
                    return
                }
            
                            throw new Error('Node "n_0_66", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_66_0_rcvs_0(m) {
                            
                IO_snd_n_0_66_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_66_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_14_0_rcvs_0(m) {
                            
                IO_snd_n_0_14_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_14_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_13_0_rcvs_0(m) {
                            
                IO_snd_n_0_13_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_13_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_17_rcvs_0(m) {
                            
                NT_floatatom_receiveMessage(N_n_0_17_state, m)
                return
            
                            throw new Error('Node "n_0_17", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_18_rcvs_0(m) {
                            
                    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                        const value = G_msg_readFloatToken(m, 0)
                        N_n_0_19_rcvs_0(G_msg_floats([G_funcs_mtof(value)]))
                        return
                    }
                
                            throw new Error('Node "n_0_18", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_19_rcvs_0(m) {
                            
                NT_floatatom_receiveMessage(N_n_0_19_state, m)
                return
            
                            throw new Error('Node "n_0_19", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_m_n_0_15_0__routemsg_rcvs_0(m) {
                            
            if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                N_m_n_0_15_0__routemsg_snds_0(m)
                return
            } else {
                G_msg_VOID_MESSAGE_RECEIVER(m)
                return
            }
        
                            throw new Error('Node "m_n_0_15_0__routemsg", inlet "0", unsupported message : ' + G_msg_display(m))
                        }
let N_m_n_0_15_0_sig_outs_0 = 0
function N_m_n_0_15_0_sig_rcvs_0(m) {
                            
    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
        N_m_n_0_15_0_sig_state.currentValue = G_msg_readFloatToken(m, 0)
        return
    }

                            throw new Error('Node "m_n_0_15_0_sig", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_19_0_rcvs_0(m) {
                            
                IO_snd_n_0_19_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_19_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_17_0_rcvs_0(m) {
                            
                IO_snd_n_0_17_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_17_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_25_rcvs_0(m) {
                            
                NT_floatatom_receiveMessage(N_n_0_25_state, m)
                return
            
                            throw new Error('Node "n_0_25", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_25_0_rcvs_0(m) {
                            
                IO_snd_n_0_25_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_25_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_26_rcvs_0(m) {
                            
                NT_tgl_receiveMessage(N_n_0_26_state, m)
                return
            
                            throw new Error('Node "n_0_26", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_54_rcvs_0(m) {
                            
            if (G_msg_getLength(m) === 1) {
                if (
                    (G_msg_isFloatToken(m, 0) && G_msg_readFloatToken(m, 0) === 0)
                    || G_actionUtils_isAction(m, 'stop')
                ) {
                    NT_metro_stop(N_n_0_54_state)
                    return
    
                } else if (
                    G_msg_isFloatToken(m, 0)
                    || G_bangUtils_isBang(m)
                ) {
                    N_n_0_54_state.realNextTick = toFloat(FRAME)
                    NT_metro_scheduleNextTick(N_n_0_54_state)
                    return
                }
            }
        
                            throw new Error('Node "n_0_54", inlet "0", unsupported message : ' + G_msg_display(m))
                        }
function N_n_0_54_rcvs_1(m) {
                            
    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
        NT_metro_setRate(N_n_0_54_state, G_msg_readFloatToken(m, 0))
        return
    }

                            throw new Error('Node "n_0_54", inlet "1", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_27_rcvs_0(m) {
                            
            NT_bang_receiveMessage(N_n_0_27_state, m)
            return
        
                            throw new Error('Node "n_0_27", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_33_rcvs_0(m) {
                            
                if (
                    G_msg_isStringToken(m, 0) 
                    && G_msg_readStringToken(m, 0) === 'set'
                ) {
                    const outTemplate = []
                    for (let i = 1; i < G_msg_getLength(m); i++) {
                        if (G_msg_isFloatToken(m, i)) {
                            outTemplate.push(G_msg_FLOAT_TOKEN)
                        } else {
                            outTemplate.push(G_msg_STRING_TOKEN)
                            outTemplate.push(G_msg_readStringToken(m, i).length)
                        }
                    }

                    const outMessage = G_msg_create(outTemplate)
                    for (let i = 1; i < G_msg_getLength(m); i++) {
                        if (G_msg_isFloatToken(m, i)) {
                            G_msg_writeFloatToken(
                                outMessage, i - 1, G_msg_readFloatToken(m, i)
                            )
                        } else {
                            G_msg_writeStringToken(
                                outMessage, i - 1, G_msg_readStringToken(m, i)
                            )
                        }
                    }

                    N_n_0_33_state.msgSpecs.splice(0, N_n_0_33_state.msgSpecs.length - 1)
                    N_n_0_33_state.msgSpecs[0] = {
                        transferFunction: function (m) {
                            return N_n_0_33_state.msgSpecs[0].outMessage
                        },
                        outTemplate: outTemplate,
                        outMessage: outMessage,
                        send: "",
                        hasSend: false,
                    }
                    return
    
                } else {
                    for (let i = 0; i < N_n_0_33_state.msgSpecs.length; i++) {
                        if (N_n_0_33_state.msgSpecs[i].hasSend) {
                            G_msgBuses_publish(N_n_0_33_state.msgSpecs[i].send, N_n_0_33_state.msgSpecs[i].transferFunction(m))
                        } else {
                            N_n_0_33_snds_0(N_n_0_33_state.msgSpecs[i].transferFunction(m))
                        }
                    }
                    return
                }
            
                            throw new Error('Node "n_0_33", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_34_rcvs_0(m) {
                            
            if (
                G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])
                || G_msg_isMatching(m, [G_msg_FLOAT_TOKEN, G_msg_FLOAT_TOKEN])
                || G_msg_isMatching(m, [G_msg_FLOAT_TOKEN, G_msg_FLOAT_TOKEN, G_msg_FLOAT_TOKEN])
            ) {
                NT_line_stopCurrentLine(N_n_0_34_state)
                switch (G_msg_getLength(m)) {
                    case 3:
                        NT_line_setGrain(N_n_0_34_state, G_msg_readFloatToken(m, 2))
                    case 2:
                        NT_line_setNextDuration(N_n_0_34_state, G_msg_readFloatToken(m, 1))
                    case 1:
                        const targetValue = G_msg_readFloatToken(m, 0)
                        if (N_n_0_34_state.nextDurationSamp === 0) {
                            N_n_0_34_state.currentValue = targetValue
                            N_n_0_35_rcvs_0(G_msg_floats([targetValue]))
                        } else {
                            N_n_0_35_rcvs_0(G_msg_floats([N_n_0_34_state.currentValue]))
                            NT_line_setNewLine(N_n_0_34_state, targetValue)
                            NT_line_incrementTime(N_n_0_34_state, N_n_0_34_state.currentLine.dx)
                            NT_line_scheduleNextTick(N_n_0_34_state)
                        }
                        
                }
                return
    
            } else if (G_actionUtils_isAction(m, 'stop')) {
                NT_line_stopCurrentLine(N_n_0_34_state)
                return
    
            } else if (
                G_msg_isMatching(m, [G_msg_STRING_TOKEN, G_msg_FLOAT_TOKEN])
                && G_msg_readStringToken(m, 0) === 'set'
            ) {
                NT_line_stopCurrentLine(N_n_0_34_state)
                N_n_0_34_state.currentValue = G_msg_readFloatToken(m, 1)
                return
            }
        
                            throw new Error('Node "n_0_34", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_35_rcvs_0(m) {
                            
                NT_floatatom_receiveMessage(N_n_0_35_state, m)
                return
            
                            throw new Error('Node "n_0_35", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_m_n_0_36_1__routemsg_rcvs_0(m) {
                            
            if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                N_m_n_0_36_1_sig_rcvs_0(m)
                return
            } else {
                G_msg_VOID_MESSAGE_RECEIVER(m)
                return
            }
        
                            throw new Error('Node "m_n_0_36_1__routemsg", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_m_n_0_36_1_sig_rcvs_0(m) {
                            
    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
        N_m_n_0_36_1_sig_state.currentValue = G_msg_readFloatToken(m, 0)
        return
    }

                            throw new Error('Node "m_n_0_36_1_sig", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_35_0_rcvs_0(m) {
                            
                IO_snd_n_0_35_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_35_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_33_0_rcvs_0(m) {
                            
                IO_snd_n_0_33_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_33_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_59_rcvs_0(m) {
                            
            if (G_msg_getLength(m) === 1) {
                if (G_msg_isStringToken(m, 0)) {
                    const action = G_msg_readStringToken(m, 0)
                    if (action === 'bang' || action === 'start') {
                        NT_delay_scheduleDelay(
                            N_n_0_59_state, 
                            () => N_n_0_67_rcvs_0(G_bangUtils_bang()),
                            FRAME,
                        )
                        return
                    } else if (action === 'stop') {
                        NT_delay_stop(N_n_0_59_state)
                        return
                    }
                    
                } else if (G_msg_isFloatToken(m, 0)) {
                    NT_delay_setDelay(N_n_0_59_state, G_msg_readFloatToken(m, 0))
                    NT_delay_scheduleDelay(
                        N_n_0_59_state,
                        () => N_n_0_67_rcvs_0(G_bangUtils_bang()),
                        FRAME,
                    )
                    return 
                }
            
            } else if (
                G_msg_isMatching(m, [G_msg_STRING_TOKEN, G_msg_FLOAT_TOKEN, G_msg_STRING_TOKEN])
                && G_msg_readStringToken(m, 0) === 'tempo'
            ) {
                N_n_0_59_state.sampleRatio = computeUnitInSamples(
                    SAMPLE_RATE, 
                    G_msg_readFloatToken(m, 1), 
                    G_msg_readStringToken(m, 2)
                )
                return
            }
        
                            throw new Error('Node "n_0_59", inlet "0", unsupported message : ' + G_msg_display(m))
                        }
function N_n_0_59_rcvs_1(m) {
                            
    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
        NT_delay_setDelay(N_n_0_59_state, G_msg_readFloatToken(m, 0))
        return
    }

                            throw new Error('Node "n_0_59", inlet "1", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_67_rcvs_0(m) {
                            
                if (
                    G_msg_isStringToken(m, 0) 
                    && G_msg_readStringToken(m, 0) === 'set'
                ) {
                    const outTemplate = []
                    for (let i = 1; i < G_msg_getLength(m); i++) {
                        if (G_msg_isFloatToken(m, i)) {
                            outTemplate.push(G_msg_FLOAT_TOKEN)
                        } else {
                            outTemplate.push(G_msg_STRING_TOKEN)
                            outTemplate.push(G_msg_readStringToken(m, i).length)
                        }
                    }

                    const outMessage = G_msg_create(outTemplate)
                    for (let i = 1; i < G_msg_getLength(m); i++) {
                        if (G_msg_isFloatToken(m, i)) {
                            G_msg_writeFloatToken(
                                outMessage, i - 1, G_msg_readFloatToken(m, i)
                            )
                        } else {
                            G_msg_writeStringToken(
                                outMessage, i - 1, G_msg_readStringToken(m, i)
                            )
                        }
                    }

                    N_n_0_67_state.msgSpecs.splice(0, N_n_0_67_state.msgSpecs.length - 1)
                    N_n_0_67_state.msgSpecs[0] = {
                        transferFunction: function (m) {
                            return N_n_0_67_state.msgSpecs[0].outMessage
                        },
                        outTemplate: outTemplate,
                        outMessage: outMessage,
                        send: "",
                        hasSend: false,
                    }
                    return
    
                } else {
                    for (let i = 0; i < N_n_0_67_state.msgSpecs.length; i++) {
                        if (N_n_0_67_state.msgSpecs[i].hasSend) {
                            G_msgBuses_publish(N_n_0_67_state.msgSpecs[i].send, N_n_0_67_state.msgSpecs[i].transferFunction(m))
                        } else {
                            N_n_0_67_snds_0(N_n_0_67_state.msgSpecs[i].transferFunction(m))
                        }
                    }
                    return
                }
            
                            throw new Error('Node "n_0_67", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_67_0_rcvs_0(m) {
                            
                IO_snd_n_0_67_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_67_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_27_0_rcvs_0(m) {
                            
                IO_snd_n_0_27_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_27_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_26_0_rcvs_0(m) {
                            
                IO_snd_n_0_26_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_26_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_30_rcvs_0(m) {
                            
                NT_floatatom_receiveMessage(N_n_0_30_state, m)
                return
            
                            throw new Error('Node "n_0_30", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_31_rcvs_0(m) {
                            
                    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                        const value = G_msg_readFloatToken(m, 0)
                        N_n_0_32_rcvs_0(G_msg_floats([G_funcs_mtof(value)]))
                        return
                    }
                
                            throw new Error('Node "n_0_31", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_32_rcvs_0(m) {
                            
                NT_floatatom_receiveMessage(N_n_0_32_state, m)
                return
            
                            throw new Error('Node "n_0_32", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_m_n_0_28_0__routemsg_rcvs_0(m) {
                            
            if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                N_m_n_0_28_0__routemsg_snds_0(m)
                return
            } else {
                G_msg_VOID_MESSAGE_RECEIVER(m)
                return
            }
        
                            throw new Error('Node "m_n_0_28_0__routemsg", inlet "0", unsupported message : ' + G_msg_display(m))
                        }
let N_m_n_0_28_0_sig_outs_0 = 0
function N_m_n_0_28_0_sig_rcvs_0(m) {
                            
    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
        N_m_n_0_28_0_sig_state.currentValue = G_msg_readFloatToken(m, 0)
        return
    }

                            throw new Error('Node "m_n_0_28_0_sig", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_32_0_rcvs_0(m) {
                            
                IO_snd_n_0_32_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_32_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_30_0_rcvs_0(m) {
                            
                IO_snd_n_0_30_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_30_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_38_rcvs_0(m) {
                            
                NT_floatatom_receiveMessage(N_n_0_38_state, m)
                return
            
                            throw new Error('Node "n_0_38", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_38_0_rcvs_0(m) {
                            
                IO_snd_n_0_38_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_38_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_39_rcvs_0(m) {
                            
                NT_tgl_receiveMessage(N_n_0_39_state, m)
                return
            
                            throw new Error('Node "n_0_39", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_55_rcvs_0(m) {
                            
            if (G_msg_getLength(m) === 1) {
                if (
                    (G_msg_isFloatToken(m, 0) && G_msg_readFloatToken(m, 0) === 0)
                    || G_actionUtils_isAction(m, 'stop')
                ) {
                    NT_metro_stop(N_n_0_55_state)
                    return
    
                } else if (
                    G_msg_isFloatToken(m, 0)
                    || G_bangUtils_isBang(m)
                ) {
                    N_n_0_55_state.realNextTick = toFloat(FRAME)
                    NT_metro_scheduleNextTick(N_n_0_55_state)
                    return
                }
            }
        
                            throw new Error('Node "n_0_55", inlet "0", unsupported message : ' + G_msg_display(m))
                        }
function N_n_0_55_rcvs_1(m) {
                            
    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
        NT_metro_setRate(N_n_0_55_state, G_msg_readFloatToken(m, 0))
        return
    }

                            throw new Error('Node "n_0_55", inlet "1", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_40_rcvs_0(m) {
                            
            NT_bang_receiveMessage(N_n_0_40_state, m)
            return
        
                            throw new Error('Node "n_0_40", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_46_rcvs_0(m) {
                            
                if (
                    G_msg_isStringToken(m, 0) 
                    && G_msg_readStringToken(m, 0) === 'set'
                ) {
                    const outTemplate = []
                    for (let i = 1; i < G_msg_getLength(m); i++) {
                        if (G_msg_isFloatToken(m, i)) {
                            outTemplate.push(G_msg_FLOAT_TOKEN)
                        } else {
                            outTemplate.push(G_msg_STRING_TOKEN)
                            outTemplate.push(G_msg_readStringToken(m, i).length)
                        }
                    }

                    const outMessage = G_msg_create(outTemplate)
                    for (let i = 1; i < G_msg_getLength(m); i++) {
                        if (G_msg_isFloatToken(m, i)) {
                            G_msg_writeFloatToken(
                                outMessage, i - 1, G_msg_readFloatToken(m, i)
                            )
                        } else {
                            G_msg_writeStringToken(
                                outMessage, i - 1, G_msg_readStringToken(m, i)
                            )
                        }
                    }

                    N_n_0_46_state.msgSpecs.splice(0, N_n_0_46_state.msgSpecs.length - 1)
                    N_n_0_46_state.msgSpecs[0] = {
                        transferFunction: function (m) {
                            return N_n_0_46_state.msgSpecs[0].outMessage
                        },
                        outTemplate: outTemplate,
                        outMessage: outMessage,
                        send: "",
                        hasSend: false,
                    }
                    return
    
                } else {
                    for (let i = 0; i < N_n_0_46_state.msgSpecs.length; i++) {
                        if (N_n_0_46_state.msgSpecs[i].hasSend) {
                            G_msgBuses_publish(N_n_0_46_state.msgSpecs[i].send, N_n_0_46_state.msgSpecs[i].transferFunction(m))
                        } else {
                            N_n_0_46_snds_0(N_n_0_46_state.msgSpecs[i].transferFunction(m))
                        }
                    }
                    return
                }
            
                            throw new Error('Node "n_0_46", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_47_rcvs_0(m) {
                            
            if (
                G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])
                || G_msg_isMatching(m, [G_msg_FLOAT_TOKEN, G_msg_FLOAT_TOKEN])
                || G_msg_isMatching(m, [G_msg_FLOAT_TOKEN, G_msg_FLOAT_TOKEN, G_msg_FLOAT_TOKEN])
            ) {
                NT_line_stopCurrentLine(N_n_0_47_state)
                switch (G_msg_getLength(m)) {
                    case 3:
                        NT_line_setGrain(N_n_0_47_state, G_msg_readFloatToken(m, 2))
                    case 2:
                        NT_line_setNextDuration(N_n_0_47_state, G_msg_readFloatToken(m, 1))
                    case 1:
                        const targetValue = G_msg_readFloatToken(m, 0)
                        if (N_n_0_47_state.nextDurationSamp === 0) {
                            N_n_0_47_state.currentValue = targetValue
                            N_n_0_48_rcvs_0(G_msg_floats([targetValue]))
                        } else {
                            N_n_0_48_rcvs_0(G_msg_floats([N_n_0_47_state.currentValue]))
                            NT_line_setNewLine(N_n_0_47_state, targetValue)
                            NT_line_incrementTime(N_n_0_47_state, N_n_0_47_state.currentLine.dx)
                            NT_line_scheduleNextTick(N_n_0_47_state)
                        }
                        
                }
                return
    
            } else if (G_actionUtils_isAction(m, 'stop')) {
                NT_line_stopCurrentLine(N_n_0_47_state)
                return
    
            } else if (
                G_msg_isMatching(m, [G_msg_STRING_TOKEN, G_msg_FLOAT_TOKEN])
                && G_msg_readStringToken(m, 0) === 'set'
            ) {
                NT_line_stopCurrentLine(N_n_0_47_state)
                N_n_0_47_state.currentValue = G_msg_readFloatToken(m, 1)
                return
            }
        
                            throw new Error('Node "n_0_47", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_48_rcvs_0(m) {
                            
                NT_floatatom_receiveMessage(N_n_0_48_state, m)
                return
            
                            throw new Error('Node "n_0_48", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_m_n_0_49_1__routemsg_rcvs_0(m) {
                            
            if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                N_m_n_0_49_1_sig_rcvs_0(m)
                return
            } else {
                G_msg_VOID_MESSAGE_RECEIVER(m)
                return
            }
        
                            throw new Error('Node "m_n_0_49_1__routemsg", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_m_n_0_49_1_sig_rcvs_0(m) {
                            
    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
        N_m_n_0_49_1_sig_state.currentValue = G_msg_readFloatToken(m, 0)
        return
    }

                            throw new Error('Node "m_n_0_49_1_sig", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_48_0_rcvs_0(m) {
                            
                IO_snd_n_0_48_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_48_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_46_0_rcvs_0(m) {
                            
                IO_snd_n_0_46_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_46_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_60_rcvs_0(m) {
                            
            if (G_msg_getLength(m) === 1) {
                if (G_msg_isStringToken(m, 0)) {
                    const action = G_msg_readStringToken(m, 0)
                    if (action === 'bang' || action === 'start') {
                        NT_delay_scheduleDelay(
                            N_n_0_60_state, 
                            () => N_n_0_68_rcvs_0(G_bangUtils_bang()),
                            FRAME,
                        )
                        return
                    } else if (action === 'stop') {
                        NT_delay_stop(N_n_0_60_state)
                        return
                    }
                    
                } else if (G_msg_isFloatToken(m, 0)) {
                    NT_delay_setDelay(N_n_0_60_state, G_msg_readFloatToken(m, 0))
                    NT_delay_scheduleDelay(
                        N_n_0_60_state,
                        () => N_n_0_68_rcvs_0(G_bangUtils_bang()),
                        FRAME,
                    )
                    return 
                }
            
            } else if (
                G_msg_isMatching(m, [G_msg_STRING_TOKEN, G_msg_FLOAT_TOKEN, G_msg_STRING_TOKEN])
                && G_msg_readStringToken(m, 0) === 'tempo'
            ) {
                N_n_0_60_state.sampleRatio = computeUnitInSamples(
                    SAMPLE_RATE, 
                    G_msg_readFloatToken(m, 1), 
                    G_msg_readStringToken(m, 2)
                )
                return
            }
        
                            throw new Error('Node "n_0_60", inlet "0", unsupported message : ' + G_msg_display(m))
                        }
function N_n_0_60_rcvs_1(m) {
                            
    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
        NT_delay_setDelay(N_n_0_60_state, G_msg_readFloatToken(m, 0))
        return
    }

                            throw new Error('Node "n_0_60", inlet "1", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_68_rcvs_0(m) {
                            
                if (
                    G_msg_isStringToken(m, 0) 
                    && G_msg_readStringToken(m, 0) === 'set'
                ) {
                    const outTemplate = []
                    for (let i = 1; i < G_msg_getLength(m); i++) {
                        if (G_msg_isFloatToken(m, i)) {
                            outTemplate.push(G_msg_FLOAT_TOKEN)
                        } else {
                            outTemplate.push(G_msg_STRING_TOKEN)
                            outTemplate.push(G_msg_readStringToken(m, i).length)
                        }
                    }

                    const outMessage = G_msg_create(outTemplate)
                    for (let i = 1; i < G_msg_getLength(m); i++) {
                        if (G_msg_isFloatToken(m, i)) {
                            G_msg_writeFloatToken(
                                outMessage, i - 1, G_msg_readFloatToken(m, i)
                            )
                        } else {
                            G_msg_writeStringToken(
                                outMessage, i - 1, G_msg_readStringToken(m, i)
                            )
                        }
                    }

                    N_n_0_68_state.msgSpecs.splice(0, N_n_0_68_state.msgSpecs.length - 1)
                    N_n_0_68_state.msgSpecs[0] = {
                        transferFunction: function (m) {
                            return N_n_0_68_state.msgSpecs[0].outMessage
                        },
                        outTemplate: outTemplate,
                        outMessage: outMessage,
                        send: "",
                        hasSend: false,
                    }
                    return
    
                } else {
                    for (let i = 0; i < N_n_0_68_state.msgSpecs.length; i++) {
                        if (N_n_0_68_state.msgSpecs[i].hasSend) {
                            G_msgBuses_publish(N_n_0_68_state.msgSpecs[i].send, N_n_0_68_state.msgSpecs[i].transferFunction(m))
                        } else {
                            N_n_0_68_snds_0(N_n_0_68_state.msgSpecs[i].transferFunction(m))
                        }
                    }
                    return
                }
            
                            throw new Error('Node "n_0_68", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_68_0_rcvs_0(m) {
                            
                IO_snd_n_0_68_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_68_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_40_0_rcvs_0(m) {
                            
                IO_snd_n_0_40_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_40_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_39_0_rcvs_0(m) {
                            
                IO_snd_n_0_39_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_39_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_43_rcvs_0(m) {
                            
                NT_floatatom_receiveMessage(N_n_0_43_state, m)
                return
            
                            throw new Error('Node "n_0_43", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_44_rcvs_0(m) {
                            
                    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                        const value = G_msg_readFloatToken(m, 0)
                        N_n_0_45_rcvs_0(G_msg_floats([G_funcs_mtof(value)]))
                        return
                    }
                
                            throw new Error('Node "n_0_44", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_45_rcvs_0(m) {
                            
                NT_floatatom_receiveMessage(N_n_0_45_state, m)
                return
            
                            throw new Error('Node "n_0_45", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_m_n_0_41_0__routemsg_rcvs_0(m) {
                            
            if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                N_m_n_0_41_0__routemsg_snds_0(m)
                return
            } else {
                G_msg_VOID_MESSAGE_RECEIVER(m)
                return
            }
        
                            throw new Error('Node "m_n_0_41_0__routemsg", inlet "0", unsupported message : ' + G_msg_display(m))
                        }
let N_m_n_0_41_0_sig_outs_0 = 0
function N_m_n_0_41_0_sig_rcvs_0(m) {
                            
    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
        N_m_n_0_41_0_sig_state.currentValue = G_msg_readFloatToken(m, 0)
        return
    }

                            throw new Error('Node "m_n_0_41_0_sig", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_45_0_rcvs_0(m) {
                            
                IO_snd_n_0_45_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_45_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_43_0_rcvs_0(m) {
                            
                IO_snd_n_0_43_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_43_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_51_rcvs_0(m) {
                            
                NT_floatatom_receiveMessage(N_n_0_51_state, m)
                return
            
                            throw new Error('Node "n_0_51", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_51_0_rcvs_0(m) {
                            
                IO_snd_n_0_51_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_51_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_56_rcvs_0(m) {
                            
                NT_floatatom_receiveMessage(N_n_0_56_state, m)
                return
            
                            throw new Error('Node "n_0_56", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_56_0_rcvs_0(m) {
                            
                IO_snd_n_0_56_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_56_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_61_rcvs_0(m) {
                            
                NT_floatatom_receiveMessage(N_n_0_61_state, m)
                return
            
                            throw new Error('Node "n_0_61", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_61_0_rcvs_0(m) {
                            
                IO_snd_n_0_61_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_61_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_62_rcvs_0(m) {
                            
                NT_floatatom_receiveMessage(N_n_0_62_state, m)
                return
            
                            throw new Error('Node "n_0_62", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_62_0_rcvs_0(m) {
                            
                IO_snd_n_0_62_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_62_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_63_rcvs_0(m) {
                            
                NT_floatatom_receiveMessage(N_n_0_63_state, m)
                return
            
                            throw new Error('Node "n_0_63", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_63_0_rcvs_0(m) {
                            
                IO_snd_n_0_63_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_63_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_64_rcvs_0(m) {
                            
                NT_floatatom_receiveMessage(N_n_0_64_state, m)
                return
            
                            throw new Error('Node "n_0_64", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_64_0_rcvs_0(m) {
                            
                IO_snd_n_0_64_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_64_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }








































































let N_n_0_2_outs_0 = 0

let N_m_n_0_3_1_sig_outs_0 = 0

let N_n_0_3_outs_0 = 0





let N_n_0_15_outs_0 = 0

let N_m_n_0_16_1_sig_outs_0 = 0

let N_n_0_16_outs_0 = 0





let N_n_0_28_outs_0 = 0

let N_m_n_0_29_1_sig_outs_0 = 0

let N_n_0_29_outs_0 = 0





let N_n_0_41_outs_0 = 0

let N_m_n_0_42_1_sig_outs_0 = 0

let N_n_0_42_outs_0 = 0





let N_n_0_12_outs_0 = 0

let N_m_n_0_70_1_sig_outs_0 = 0

let N_n_0_70_outs_0 = 0



let N_n_0_71_outs_0 = 0



function N_n_0_0_snds_0(m) {
                        N_n_0_52_rcvs_0(m)
N_n_ioSnd_n_0_0_0_rcvs_0(m)
                    }
function N_n_0_1_snds_0(m) {
                        N_n_0_7_rcvs_0(m)
N_n_0_57_rcvs_0(m)
N_n_ioSnd_n_0_1_0_rcvs_0(m)
                    }
function N_n_0_7_snds_0(m) {
                        N_n_0_8_rcvs_0(m)
N_n_ioSnd_n_0_7_0_rcvs_0(m)
                    }
function N_n_0_9_snds_0(m) {
                        N_m_n_0_10_1__routemsg_rcvs_0(m)
N_n_ioSnd_n_0_9_0_rcvs_0(m)
                    }
function N_n_0_65_snds_0(m) {
                        N_n_0_8_rcvs_0(m)
N_n_ioSnd_n_0_65_0_rcvs_0(m)
                    }
function N_n_0_4_snds_0(m) {
                        N_n_0_5_rcvs_0(m)
N_n_ioSnd_n_0_4_0_rcvs_0(m)
                    }
function N_n_0_6_snds_0(m) {
                        N_m_n_0_2_0__routemsg_rcvs_0(m)
N_n_ioSnd_n_0_6_0_rcvs_0(m)
                    }
function N_m_n_0_2_0__routemsg_snds_0(m) {
                        N_m_n_0_2_0_sig_rcvs_0(m)
COLD_0(m)
                    }
function N_n_0_13_snds_0(m) {
                        N_n_0_53_rcvs_0(m)
N_n_ioSnd_n_0_13_0_rcvs_0(m)
                    }
function N_n_0_14_snds_0(m) {
                        N_n_0_20_rcvs_0(m)
N_n_0_58_rcvs_0(m)
N_n_ioSnd_n_0_14_0_rcvs_0(m)
                    }
function N_n_0_20_snds_0(m) {
                        N_n_0_21_rcvs_0(m)
N_n_ioSnd_n_0_20_0_rcvs_0(m)
                    }
function N_n_0_22_snds_0(m) {
                        N_m_n_0_23_1__routemsg_rcvs_0(m)
N_n_ioSnd_n_0_22_0_rcvs_0(m)
                    }
function N_n_0_66_snds_0(m) {
                        N_n_0_21_rcvs_0(m)
N_n_ioSnd_n_0_66_0_rcvs_0(m)
                    }
function N_n_0_17_snds_0(m) {
                        N_n_0_18_rcvs_0(m)
N_n_ioSnd_n_0_17_0_rcvs_0(m)
                    }
function N_n_0_19_snds_0(m) {
                        N_m_n_0_15_0__routemsg_rcvs_0(m)
N_n_ioSnd_n_0_19_0_rcvs_0(m)
                    }
function N_m_n_0_15_0__routemsg_snds_0(m) {
                        N_m_n_0_15_0_sig_rcvs_0(m)
COLD_2(m)
                    }
function N_n_0_25_snds_0(m) {
                        N_n_0_53_rcvs_1(m)
N_n_ioSnd_n_0_25_0_rcvs_0(m)
                    }
function N_n_0_26_snds_0(m) {
                        N_n_0_54_rcvs_0(m)
N_n_ioSnd_n_0_26_0_rcvs_0(m)
                    }
function N_n_0_27_snds_0(m) {
                        N_n_0_33_rcvs_0(m)
N_n_0_59_rcvs_0(m)
N_n_ioSnd_n_0_27_0_rcvs_0(m)
                    }
function N_n_0_33_snds_0(m) {
                        N_n_0_34_rcvs_0(m)
N_n_ioSnd_n_0_33_0_rcvs_0(m)
                    }
function N_n_0_35_snds_0(m) {
                        N_m_n_0_36_1__routemsg_rcvs_0(m)
N_n_ioSnd_n_0_35_0_rcvs_0(m)
                    }
function N_n_0_67_snds_0(m) {
                        N_n_0_34_rcvs_0(m)
N_n_ioSnd_n_0_67_0_rcvs_0(m)
                    }
function N_n_0_30_snds_0(m) {
                        N_n_0_31_rcvs_0(m)
N_n_ioSnd_n_0_30_0_rcvs_0(m)
                    }
function N_n_0_32_snds_0(m) {
                        N_m_n_0_28_0__routemsg_rcvs_0(m)
N_n_ioSnd_n_0_32_0_rcvs_0(m)
                    }
function N_m_n_0_28_0__routemsg_snds_0(m) {
                        N_m_n_0_28_0_sig_rcvs_0(m)
COLD_4(m)
                    }
function N_n_0_38_snds_0(m) {
                        N_n_0_54_rcvs_1(m)
N_n_ioSnd_n_0_38_0_rcvs_0(m)
                    }
function N_n_0_39_snds_0(m) {
                        N_n_0_55_rcvs_0(m)
N_n_ioSnd_n_0_39_0_rcvs_0(m)
                    }
function N_n_0_40_snds_0(m) {
                        N_n_0_46_rcvs_0(m)
N_n_0_60_rcvs_0(m)
N_n_ioSnd_n_0_40_0_rcvs_0(m)
                    }
function N_n_0_46_snds_0(m) {
                        N_n_0_47_rcvs_0(m)
N_n_ioSnd_n_0_46_0_rcvs_0(m)
                    }
function N_n_0_48_snds_0(m) {
                        N_m_n_0_49_1__routemsg_rcvs_0(m)
N_n_ioSnd_n_0_48_0_rcvs_0(m)
                    }
function N_n_0_68_snds_0(m) {
                        N_n_0_47_rcvs_0(m)
N_n_ioSnd_n_0_68_0_rcvs_0(m)
                    }
function N_n_0_43_snds_0(m) {
                        N_n_0_44_rcvs_0(m)
N_n_ioSnd_n_0_43_0_rcvs_0(m)
                    }
function N_n_0_45_snds_0(m) {
                        N_m_n_0_41_0__routemsg_rcvs_0(m)
N_n_ioSnd_n_0_45_0_rcvs_0(m)
                    }
function N_m_n_0_41_0__routemsg_snds_0(m) {
                        N_m_n_0_41_0_sig_rcvs_0(m)
COLD_6(m)
                    }
function N_n_0_51_snds_0(m) {
                        N_n_0_55_rcvs_1(m)
N_n_ioSnd_n_0_51_0_rcvs_0(m)
                    }
function N_n_0_56_snds_0(m) {
                        N_n_0_52_rcvs_1(m)
N_n_ioSnd_n_0_56_0_rcvs_0(m)
                    }
function N_n_0_61_snds_0(m) {
                        N_n_0_57_rcvs_1(m)
N_n_ioSnd_n_0_61_0_rcvs_0(m)
                    }
function N_n_0_62_snds_0(m) {
                        N_n_0_58_rcvs_1(m)
N_n_ioSnd_n_0_62_0_rcvs_0(m)
                    }
function N_n_0_63_snds_0(m) {
                        N_n_0_59_rcvs_1(m)
N_n_ioSnd_n_0_63_0_rcvs_0(m)
                    }
function N_n_0_64_snds_0(m) {
                        N_n_0_60_rcvs_1(m)
N_n_ioSnd_n_0_64_0_rcvs_0(m)
                    }

        function COLD_0(m) {
                    N_m_n_0_2_0_sig_outs_0 = N_m_n_0_2_0_sig_state.currentValue
                    NT_phasor_t_setStep(N_n_0_2_state, N_m_n_0_2_0_sig_outs_0)
                }
function COLD_1(m) {
                    N_m_n_0_3_1_sig_outs_0 = N_m_n_0_3_1_sig_state.currentValue
                    NT_lop_t_setFreq(N_n_0_3_state, N_m_n_0_3_1_sig_outs_0)
                }
function COLD_2(m) {
                    N_m_n_0_15_0_sig_outs_0 = N_m_n_0_15_0_sig_state.currentValue
                    NT_phasor_t_setStep(N_n_0_15_state, N_m_n_0_15_0_sig_outs_0)
                }
function COLD_3(m) {
                    N_m_n_0_16_1_sig_outs_0 = N_m_n_0_16_1_sig_state.currentValue
                    NT_lop_t_setFreq(N_n_0_16_state, N_m_n_0_16_1_sig_outs_0)
                }
function COLD_4(m) {
                    N_m_n_0_28_0_sig_outs_0 = N_m_n_0_28_0_sig_state.currentValue
                    NT_phasor_t_setStep(N_n_0_28_state, N_m_n_0_28_0_sig_outs_0)
                }
function COLD_5(m) {
                    N_m_n_0_29_1_sig_outs_0 = N_m_n_0_29_1_sig_state.currentValue
                    NT_lop_t_setFreq(N_n_0_29_state, N_m_n_0_29_1_sig_outs_0)
                }
function COLD_6(m) {
                    N_m_n_0_41_0_sig_outs_0 = N_m_n_0_41_0_sig_state.currentValue
                    NT_phasor_t_setStep(N_n_0_41_state, N_m_n_0_41_0_sig_outs_0)
                }
function COLD_7(m) {
                    N_m_n_0_42_1_sig_outs_0 = N_m_n_0_42_1_sig_state.currentValue
                    NT_lop_t_setFreq(N_n_0_42_state, N_m_n_0_42_1_sig_outs_0)
                }
function COLD_8(m) {
                    N_m_n_0_70_1_sig_outs_0 = N_m_n_0_70_1_sig_state.currentValue
                    NT_lop_t_setFreq(N_n_0_70_state, N_m_n_0_70_1_sig_outs_0)
                }
        function IO_rcv_n_0_0_0(m) {
                    N_n_0_0_rcvs_0(m)
                }
function IO_rcv_n_0_1_0(m) {
                    N_n_0_1_rcvs_0(m)
                }
function IO_rcv_n_0_4_0(m) {
                    N_n_0_4_rcvs_0(m)
                }
function IO_rcv_n_0_6_0(m) {
                    N_n_0_6_rcvs_0(m)
                }
function IO_rcv_n_0_7_0(m) {
                    N_n_0_7_rcvs_0(m)
                }
function IO_rcv_n_0_9_0(m) {
                    N_n_0_9_rcvs_0(m)
                }
function IO_rcv_n_0_13_0(m) {
                    N_n_0_13_rcvs_0(m)
                }
function IO_rcv_n_0_14_0(m) {
                    N_n_0_14_rcvs_0(m)
                }
function IO_rcv_n_0_17_0(m) {
                    N_n_0_17_rcvs_0(m)
                }
function IO_rcv_n_0_19_0(m) {
                    N_n_0_19_rcvs_0(m)
                }
function IO_rcv_n_0_20_0(m) {
                    N_n_0_20_rcvs_0(m)
                }
function IO_rcv_n_0_22_0(m) {
                    N_n_0_22_rcvs_0(m)
                }
function IO_rcv_n_0_25_0(m) {
                    N_n_0_25_rcvs_0(m)
                }
function IO_rcv_n_0_26_0(m) {
                    N_n_0_26_rcvs_0(m)
                }
function IO_rcv_n_0_27_0(m) {
                    N_n_0_27_rcvs_0(m)
                }
function IO_rcv_n_0_30_0(m) {
                    N_n_0_30_rcvs_0(m)
                }
function IO_rcv_n_0_32_0(m) {
                    N_n_0_32_rcvs_0(m)
                }
function IO_rcv_n_0_33_0(m) {
                    N_n_0_33_rcvs_0(m)
                }
function IO_rcv_n_0_35_0(m) {
                    N_n_0_35_rcvs_0(m)
                }
function IO_rcv_n_0_38_0(m) {
                    N_n_0_38_rcvs_0(m)
                }
function IO_rcv_n_0_39_0(m) {
                    N_n_0_39_rcvs_0(m)
                }
function IO_rcv_n_0_40_0(m) {
                    N_n_0_40_rcvs_0(m)
                }
function IO_rcv_n_0_43_0(m) {
                    N_n_0_43_rcvs_0(m)
                }
function IO_rcv_n_0_45_0(m) {
                    N_n_0_45_rcvs_0(m)
                }
function IO_rcv_n_0_46_0(m) {
                    N_n_0_46_rcvs_0(m)
                }
function IO_rcv_n_0_48_0(m) {
                    N_n_0_48_rcvs_0(m)
                }
function IO_rcv_n_0_51_0(m) {
                    N_n_0_51_rcvs_0(m)
                }
function IO_rcv_n_0_56_0(m) {
                    N_n_0_56_rcvs_0(m)
                }
function IO_rcv_n_0_61_0(m) {
                    N_n_0_61_rcvs_0(m)
                }
function IO_rcv_n_0_62_0(m) {
                    N_n_0_62_rcvs_0(m)
                }
function IO_rcv_n_0_63_0(m) {
                    N_n_0_63_rcvs_0(m)
                }
function IO_rcv_n_0_64_0(m) {
                    N_n_0_64_rcvs_0(m)
                }
function IO_rcv_n_0_65_0(m) {
                    N_n_0_65_rcvs_0(m)
                }
function IO_rcv_n_0_66_0(m) {
                    N_n_0_66_rcvs_0(m)
                }
function IO_rcv_n_0_67_0(m) {
                    N_n_0_67_rcvs_0(m)
                }
function IO_rcv_n_0_68_0(m) {
                    N_n_0_68_rcvs_0(m)
                }
        const IO_snd_n_0_0_0 = (m) => {exports.io.messageSenders['n_0_0']['0'](m)}
const IO_snd_n_0_1_0 = (m) => {exports.io.messageSenders['n_0_1']['0'](m)}
const IO_snd_n_0_4_0 = (m) => {exports.io.messageSenders['n_0_4']['0'](m)}
const IO_snd_n_0_6_0 = (m) => {exports.io.messageSenders['n_0_6']['0'](m)}
const IO_snd_n_0_7_0 = (m) => {exports.io.messageSenders['n_0_7']['0'](m)}
const IO_snd_n_0_9_0 = (m) => {exports.io.messageSenders['n_0_9']['0'](m)}
const IO_snd_n_0_13_0 = (m) => {exports.io.messageSenders['n_0_13']['0'](m)}
const IO_snd_n_0_14_0 = (m) => {exports.io.messageSenders['n_0_14']['0'](m)}
const IO_snd_n_0_17_0 = (m) => {exports.io.messageSenders['n_0_17']['0'](m)}
const IO_snd_n_0_19_0 = (m) => {exports.io.messageSenders['n_0_19']['0'](m)}
const IO_snd_n_0_20_0 = (m) => {exports.io.messageSenders['n_0_20']['0'](m)}
const IO_snd_n_0_22_0 = (m) => {exports.io.messageSenders['n_0_22']['0'](m)}
const IO_snd_n_0_25_0 = (m) => {exports.io.messageSenders['n_0_25']['0'](m)}
const IO_snd_n_0_26_0 = (m) => {exports.io.messageSenders['n_0_26']['0'](m)}
const IO_snd_n_0_27_0 = (m) => {exports.io.messageSenders['n_0_27']['0'](m)}
const IO_snd_n_0_30_0 = (m) => {exports.io.messageSenders['n_0_30']['0'](m)}
const IO_snd_n_0_32_0 = (m) => {exports.io.messageSenders['n_0_32']['0'](m)}
const IO_snd_n_0_33_0 = (m) => {exports.io.messageSenders['n_0_33']['0'](m)}
const IO_snd_n_0_35_0 = (m) => {exports.io.messageSenders['n_0_35']['0'](m)}
const IO_snd_n_0_38_0 = (m) => {exports.io.messageSenders['n_0_38']['0'](m)}
const IO_snd_n_0_39_0 = (m) => {exports.io.messageSenders['n_0_39']['0'](m)}
const IO_snd_n_0_40_0 = (m) => {exports.io.messageSenders['n_0_40']['0'](m)}
const IO_snd_n_0_43_0 = (m) => {exports.io.messageSenders['n_0_43']['0'](m)}
const IO_snd_n_0_45_0 = (m) => {exports.io.messageSenders['n_0_45']['0'](m)}
const IO_snd_n_0_46_0 = (m) => {exports.io.messageSenders['n_0_46']['0'](m)}
const IO_snd_n_0_48_0 = (m) => {exports.io.messageSenders['n_0_48']['0'](m)}
const IO_snd_n_0_51_0 = (m) => {exports.io.messageSenders['n_0_51']['0'](m)}
const IO_snd_n_0_56_0 = (m) => {exports.io.messageSenders['n_0_56']['0'](m)}
const IO_snd_n_0_61_0 = (m) => {exports.io.messageSenders['n_0_61']['0'](m)}
const IO_snd_n_0_62_0 = (m) => {exports.io.messageSenders['n_0_62']['0'](m)}
const IO_snd_n_0_63_0 = (m) => {exports.io.messageSenders['n_0_63']['0'](m)}
const IO_snd_n_0_64_0 = (m) => {exports.io.messageSenders['n_0_64']['0'](m)}
const IO_snd_n_0_65_0 = (m) => {exports.io.messageSenders['n_0_65']['0'](m)}
const IO_snd_n_0_66_0 = (m) => {exports.io.messageSenders['n_0_66']['0'](m)}
const IO_snd_n_0_67_0 = (m) => {exports.io.messageSenders['n_0_67']['0'](m)}
const IO_snd_n_0_68_0 = (m) => {exports.io.messageSenders['n_0_68']['0'](m)}

        const exports = {
            metadata: {"libVersion":"0.2.1","customMetadata":{"pdNodes":{"0":{"0":{"id":"0","type":"tgl","args":[1,0,1,"",""],"nodeClass":"control","layout":{"x":62,"y":20,"size":15,"label":"","labelX":17,"labelY":7,"labelFont":"0","labelFontSize":10,"bgColor":"-262144","fgColor":"-1","labelColor":"-1"}},"1":{"id":"1","type":"bng","args":[0,"",""],"nodeClass":"control","layout":{"x":63,"y":116,"size":15,"hold":250,"interrupt":50,"label":"","labelX":17,"labelY":7,"labelFont":"0","labelFontSize":10,"bgColor":"-262144","fgColor":"-1","labelColor":"-1"}},"4":{"id":"4","type":"floatatom","args":[0,0,"",""],"nodeClass":"control","layout":{"x":291,"y":32,"widthInChars":5,"labelPos":0,"label":""}},"6":{"id":"6","type":"floatatom","args":[0,0,"",""],"nodeClass":"control","layout":{"x":290,"y":98,"widthInChars":5,"labelPos":0,"label":""}},"7":{"id":"7","type":"msg","args":[1,300],"nodeClass":"control","layout":{"x":59,"y":203}},"9":{"id":"9","type":"floatatom","args":[0,0,"",""],"nodeClass":"control","layout":{"x":98,"y":293,"widthInChars":5,"labelPos":0,"label":""}},"13":{"id":"13","type":"tgl","args":[1,0,1,"",""],"nodeClass":"control","layout":{"x":447,"y":26,"size":15,"label":"","labelX":17,"labelY":7,"labelFont":"0","labelFontSize":10,"bgColor":"-262144","fgColor":"-1","labelColor":"-1"}},"14":{"id":"14","type":"bng","args":[0,"",""],"nodeClass":"control","layout":{"x":448,"y":122,"size":15,"hold":250,"interrupt":50,"label":"","labelX":17,"labelY":7,"labelFont":"0","labelFontSize":10,"bgColor":"-262144","fgColor":"-1","labelColor":"-1"}},"17":{"id":"17","type":"floatatom","args":[0,0,"",""],"nodeClass":"control","layout":{"x":676,"y":43,"widthInChars":5,"labelPos":0,"label":""}},"19":{"id":"19","type":"floatatom","args":[0,0,"",""],"nodeClass":"control","layout":{"x":675,"y":104,"widthInChars":5,"labelPos":0,"label":""}},"20":{"id":"20","type":"msg","args":[1,300],"nodeClass":"control","layout":{"x":444,"y":209}},"22":{"id":"22","type":"floatatom","args":[0,0,"",""],"nodeClass":"control","layout":{"x":483,"y":299,"widthInChars":5,"labelPos":0,"label":""}},"25":{"id":"25","type":"floatatom","args":[0,0,"",""],"nodeClass":"control","layout":{"x":537,"y":19,"widthInChars":5,"labelPos":0,"label":""}},"26":{"id":"26","type":"tgl","args":[1,0,1,"",""],"nodeClass":"control","layout":{"x":787,"y":44,"size":15,"label":"","labelX":17,"labelY":7,"labelFont":"0","labelFontSize":10,"bgColor":"-262144","fgColor":"-1","labelColor":"-1"}},"27":{"id":"27","type":"bng","args":[0,"",""],"nodeClass":"control","layout":{"x":788,"y":140,"size":15,"hold":250,"interrupt":50,"label":"","labelX":17,"labelY":7,"labelFont":"0","labelFontSize":10,"bgColor":"-262144","fgColor":"-1","labelColor":"-1"}},"30":{"id":"30","type":"floatatom","args":[0,0,"",""],"nodeClass":"control","layout":{"x":1016,"y":61,"widthInChars":5,"labelPos":0,"label":""}},"32":{"id":"32","type":"floatatom","args":[0,0,"",""],"nodeClass":"control","layout":{"x":1015,"y":122,"widthInChars":5,"labelPos":0,"label":""}},"33":{"id":"33","type":"msg","args":[1,300],"nodeClass":"control","layout":{"x":784,"y":227}},"35":{"id":"35","type":"floatatom","args":[0,0,"",""],"nodeClass":"control","layout":{"x":823,"y":317,"widthInChars":5,"labelPos":0,"label":""}},"38":{"id":"38","type":"floatatom","args":[0,0,"",""],"nodeClass":"control","layout":{"x":877,"y":37,"widthInChars":5,"labelPos":0,"label":""}},"39":{"id":"39","type":"tgl","args":[1,0,1,"",""],"nodeClass":"control","layout":{"x":1153,"y":55,"size":15,"label":"","labelX":17,"labelY":7,"labelFont":"0","labelFontSize":10,"bgColor":"-262144","fgColor":"-1","labelColor":"-1"}},"40":{"id":"40","type":"bng","args":[0,"",""],"nodeClass":"control","layout":{"x":1154,"y":151,"size":15,"hold":250,"interrupt":50,"label":"","labelX":17,"labelY":7,"labelFont":"0","labelFontSize":10,"bgColor":"-262144","fgColor":"-1","labelColor":"-1"}},"43":{"id":"43","type":"floatatom","args":[0,0,"",""],"nodeClass":"control","layout":{"x":1382,"y":72,"widthInChars":5,"labelPos":0,"label":""}},"45":{"id":"45","type":"floatatom","args":[0,0,"",""],"nodeClass":"control","layout":{"x":1381,"y":133,"widthInChars":5,"labelPos":0,"label":""}},"46":{"id":"46","type":"msg","args":[1,300],"nodeClass":"control","layout":{"x":1150,"y":238}},"48":{"id":"48","type":"floatatom","args":[0,0,"",""],"nodeClass":"control","layout":{"x":1189,"y":328,"widthInChars":5,"labelPos":0,"label":""}},"51":{"id":"51","type":"floatatom","args":[0,0,"",""],"nodeClass":"control","layout":{"x":1243,"y":47,"widthInChars":5,"labelPos":0,"label":""}},"56":{"id":"56","type":"floatatom","args":[0,0,"",""],"nodeClass":"control","layout":{"x":156,"y":4,"widthInChars":5,"labelPos":0,"label":""}},"61":{"id":"61","type":"floatatom","args":[0,0,"",""],"nodeClass":"control","layout":{"x":187,"y":107,"widthInChars":5,"labelPos":0,"label":""}},"62":{"id":"62","type":"floatatom","args":[0,0,"",""],"nodeClass":"control","layout":{"x":568,"y":106,"widthInChars":5,"labelPos":0,"label":""}},"63":{"id":"63","type":"floatatom","args":[0,0,"",""],"nodeClass":"control","layout":{"x":911,"y":114,"widthInChars":5,"labelPos":0,"label":""}},"64":{"id":"64","type":"floatatom","args":[0,0,"",""],"nodeClass":"control","layout":{"x":1275,"y":130,"widthInChars":5,"labelPos":0,"label":""}},"65":{"id":"65","type":"msg","args":[0,400],"nodeClass":"control","layout":{"x":125,"y":205}},"66":{"id":"66","type":"msg","args":[0,400],"nodeClass":"control","layout":{"x":513,"y":212}},"67":{"id":"67","type":"msg","args":[0,400],"nodeClass":"control","layout":{"x":852,"y":228}},"68":{"id":"68","type":"msg","args":[0,400],"nodeClass":"control","layout":{"x":1218,"y":240}}}},"graph":{"n_0_0":{"id":"n_0_0","type":"tgl","args":{"minValue":0,"maxValue":1,"sendBusName":"empty","receiveBusName":"empty","initValue":0,"outputOnLoad":false},"sources":{"0":[{"nodeId":"n_ioRcv_n_0_0_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_52","portletId":"0"},{"nodeId":"n_ioSnd_n_0_0_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_1":{"id":"n_0_1","type":"bang","args":{"outputOnLoad":false,"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_0_52","portletId":"0"},{"nodeId":"n_ioRcv_n_0_1_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_7","portletId":"0"},{"nodeId":"n_0_57","portletId":"0"},{"nodeId":"n_ioSnd_n_0_1_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_4":{"id":"n_0_4","type":"floatatom","args":{"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_ioRcv_n_0_4_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_5","portletId":"0"},{"nodeId":"n_ioSnd_n_0_4_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_6":{"id":"n_0_6","type":"floatatom","args":{"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_0_5","portletId":"0"},{"nodeId":"n_ioRcv_n_0_6_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"m_n_0_2_0__routemsg","portletId":"0"},{"nodeId":"n_ioSnd_n_0_6_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_7":{"id":"n_0_7","type":"msg","args":{"msgSpecs":[{"tokens":[1,300],"send":null}]},"sources":{"0":[{"nodeId":"n_0_1","portletId":"0"},{"nodeId":"n_ioRcv_n_0_7_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_8","portletId":"0"},{"nodeId":"n_ioSnd_n_0_7_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}}},"n_0_9":{"id":"n_0_9","type":"floatatom","args":{"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_0_8","portletId":"0"},{"nodeId":"n_ioRcv_n_0_9_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"m_n_0_10_1__routemsg","portletId":"0"},{"nodeId":"n_ioSnd_n_0_9_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_13":{"id":"n_0_13","type":"tgl","args":{"minValue":0,"maxValue":1,"sendBusName":"empty","receiveBusName":"empty","initValue":0,"outputOnLoad":false},"sources":{"0":[{"nodeId":"n_ioRcv_n_0_13_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_53","portletId":"0"},{"nodeId":"n_ioSnd_n_0_13_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_14":{"id":"n_0_14","type":"bang","args":{"outputOnLoad":false,"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_0_53","portletId":"0"},{"nodeId":"n_ioRcv_n_0_14_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_20","portletId":"0"},{"nodeId":"n_0_58","portletId":"0"},{"nodeId":"n_ioSnd_n_0_14_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_17":{"id":"n_0_17","type":"floatatom","args":{"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_ioRcv_n_0_17_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_18","portletId":"0"},{"nodeId":"n_ioSnd_n_0_17_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_19":{"id":"n_0_19","type":"floatatom","args":{"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_0_18","portletId":"0"},{"nodeId":"n_ioRcv_n_0_19_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"m_n_0_15_0__routemsg","portletId":"0"},{"nodeId":"n_ioSnd_n_0_19_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_20":{"id":"n_0_20","type":"msg","args":{"msgSpecs":[{"tokens":[1,300],"send":null}]},"sources":{"0":[{"nodeId":"n_0_14","portletId":"0"},{"nodeId":"n_ioRcv_n_0_20_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_21","portletId":"0"},{"nodeId":"n_ioSnd_n_0_20_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}}},"n_0_22":{"id":"n_0_22","type":"floatatom","args":{"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_0_21","portletId":"0"},{"nodeId":"n_ioRcv_n_0_22_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"m_n_0_23_1__routemsg","portletId":"0"},{"nodeId":"n_ioSnd_n_0_22_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_25":{"id":"n_0_25","type":"floatatom","args":{"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_ioRcv_n_0_25_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_53","portletId":"1"},{"nodeId":"n_ioSnd_n_0_25_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_26":{"id":"n_0_26","type":"tgl","args":{"minValue":0,"maxValue":1,"sendBusName":"empty","receiveBusName":"empty","initValue":0,"outputOnLoad":false},"sources":{"0":[{"nodeId":"n_ioRcv_n_0_26_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_54","portletId":"0"},{"nodeId":"n_ioSnd_n_0_26_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_27":{"id":"n_0_27","type":"bang","args":{"outputOnLoad":false,"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_0_54","portletId":"0"},{"nodeId":"n_ioRcv_n_0_27_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_33","portletId":"0"},{"nodeId":"n_0_59","portletId":"0"},{"nodeId":"n_ioSnd_n_0_27_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_30":{"id":"n_0_30","type":"floatatom","args":{"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_ioRcv_n_0_30_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_31","portletId":"0"},{"nodeId":"n_ioSnd_n_0_30_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_32":{"id":"n_0_32","type":"floatatom","args":{"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_0_31","portletId":"0"},{"nodeId":"n_ioRcv_n_0_32_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"m_n_0_28_0__routemsg","portletId":"0"},{"nodeId":"n_ioSnd_n_0_32_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_33":{"id":"n_0_33","type":"msg","args":{"msgSpecs":[{"tokens":[1,300],"send":null}]},"sources":{"0":[{"nodeId":"n_0_27","portletId":"0"},{"nodeId":"n_ioRcv_n_0_33_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_34","portletId":"0"},{"nodeId":"n_ioSnd_n_0_33_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}}},"n_0_35":{"id":"n_0_35","type":"floatatom","args":{"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_0_34","portletId":"0"},{"nodeId":"n_ioRcv_n_0_35_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"m_n_0_36_1__routemsg","portletId":"0"},{"nodeId":"n_ioSnd_n_0_35_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_38":{"id":"n_0_38","type":"floatatom","args":{"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_ioRcv_n_0_38_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_54","portletId":"1"},{"nodeId":"n_ioSnd_n_0_38_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_39":{"id":"n_0_39","type":"tgl","args":{"minValue":0,"maxValue":1,"sendBusName":"empty","receiveBusName":"empty","initValue":0,"outputOnLoad":false},"sources":{"0":[{"nodeId":"n_ioRcv_n_0_39_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_55","portletId":"0"},{"nodeId":"n_ioSnd_n_0_39_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_40":{"id":"n_0_40","type":"bang","args":{"outputOnLoad":false,"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_0_55","portletId":"0"},{"nodeId":"n_ioRcv_n_0_40_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_46","portletId":"0"},{"nodeId":"n_0_60","portletId":"0"},{"nodeId":"n_ioSnd_n_0_40_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_43":{"id":"n_0_43","type":"floatatom","args":{"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_ioRcv_n_0_43_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_44","portletId":"0"},{"nodeId":"n_ioSnd_n_0_43_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_45":{"id":"n_0_45","type":"floatatom","args":{"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_0_44","portletId":"0"},{"nodeId":"n_ioRcv_n_0_45_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"m_n_0_41_0__routemsg","portletId":"0"},{"nodeId":"n_ioSnd_n_0_45_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_46":{"id":"n_0_46","type":"msg","args":{"msgSpecs":[{"tokens":[1,300],"send":null}]},"sources":{"0":[{"nodeId":"n_0_40","portletId":"0"},{"nodeId":"n_ioRcv_n_0_46_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_47","portletId":"0"},{"nodeId":"n_ioSnd_n_0_46_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}}},"n_0_48":{"id":"n_0_48","type":"floatatom","args":{"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_0_47","portletId":"0"},{"nodeId":"n_ioRcv_n_0_48_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"m_n_0_49_1__routemsg","portletId":"0"},{"nodeId":"n_ioSnd_n_0_48_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_51":{"id":"n_0_51","type":"floatatom","args":{"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_ioRcv_n_0_51_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_55","portletId":"1"},{"nodeId":"n_ioSnd_n_0_51_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_56":{"id":"n_0_56","type":"floatatom","args":{"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_ioRcv_n_0_56_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_52","portletId":"1"},{"nodeId":"n_ioSnd_n_0_56_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_61":{"id":"n_0_61","type":"floatatom","args":{"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_ioRcv_n_0_61_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_57","portletId":"1"},{"nodeId":"n_ioSnd_n_0_61_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_62":{"id":"n_0_62","type":"floatatom","args":{"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_ioRcv_n_0_62_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_58","portletId":"1"},{"nodeId":"n_ioSnd_n_0_62_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_63":{"id":"n_0_63","type":"floatatom","args":{"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_ioRcv_n_0_63_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_59","portletId":"1"},{"nodeId":"n_ioSnd_n_0_63_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_64":{"id":"n_0_64","type":"floatatom","args":{"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_ioRcv_n_0_64_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_60","portletId":"1"},{"nodeId":"n_ioSnd_n_0_64_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_65":{"id":"n_0_65","type":"msg","args":{"msgSpecs":[{"tokens":[0,400],"send":null}]},"sources":{"0":[{"nodeId":"n_0_57","portletId":"0"},{"nodeId":"n_ioRcv_n_0_65_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_8","portletId":"0"},{"nodeId":"n_ioSnd_n_0_65_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}}},"n_0_66":{"id":"n_0_66","type":"msg","args":{"msgSpecs":[{"tokens":[0,400],"send":null}]},"sources":{"0":[{"nodeId":"n_0_58","portletId":"0"},{"nodeId":"n_ioRcv_n_0_66_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_21","portletId":"0"},{"nodeId":"n_ioSnd_n_0_66_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}}},"n_0_67":{"id":"n_0_67","type":"msg","args":{"msgSpecs":[{"tokens":[0,400],"send":null}]},"sources":{"0":[{"nodeId":"n_0_59","portletId":"0"},{"nodeId":"n_ioRcv_n_0_67_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_34","portletId":"0"},{"nodeId":"n_ioSnd_n_0_67_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}}},"n_0_68":{"id":"n_0_68","type":"msg","args":{"msgSpecs":[{"tokens":[0,400],"send":null}]},"sources":{"0":[{"nodeId":"n_0_60","portletId":"0"},{"nodeId":"n_ioRcv_n_0_68_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_47","portletId":"0"},{"nodeId":"n_ioSnd_n_0_68_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}}}},"pdGui":[{"nodeClass":"control","patchId":"0","pdNodeId":"0","nodeId":"n_0_0"},{"nodeClass":"control","patchId":"0","pdNodeId":"1","nodeId":"n_0_1"},{"nodeClass":"control","patchId":"0","pdNodeId":"4","nodeId":"n_0_4"},{"nodeClass":"control","patchId":"0","pdNodeId":"6","nodeId":"n_0_6"},{"nodeClass":"control","patchId":"0","pdNodeId":"7","nodeId":"n_0_7"},{"nodeClass":"control","patchId":"0","pdNodeId":"9","nodeId":"n_0_9"},{"nodeClass":"control","patchId":"0","pdNodeId":"13","nodeId":"n_0_13"},{"nodeClass":"control","patchId":"0","pdNodeId":"14","nodeId":"n_0_14"},{"nodeClass":"control","patchId":"0","pdNodeId":"17","nodeId":"n_0_17"},{"nodeClass":"control","patchId":"0","pdNodeId":"19","nodeId":"n_0_19"},{"nodeClass":"control","patchId":"0","pdNodeId":"20","nodeId":"n_0_20"},{"nodeClass":"control","patchId":"0","pdNodeId":"22","nodeId":"n_0_22"},{"nodeClass":"control","patchId":"0","pdNodeId":"25","nodeId":"n_0_25"},{"nodeClass":"control","patchId":"0","pdNodeId":"26","nodeId":"n_0_26"},{"nodeClass":"control","patchId":"0","pdNodeId":"27","nodeId":"n_0_27"},{"nodeClass":"control","patchId":"0","pdNodeId":"30","nodeId":"n_0_30"},{"nodeClass":"control","patchId":"0","pdNodeId":"32","nodeId":"n_0_32"},{"nodeClass":"control","patchId":"0","pdNodeId":"33","nodeId":"n_0_33"},{"nodeClass":"control","patchId":"0","pdNodeId":"35","nodeId":"n_0_35"},{"nodeClass":"control","patchId":"0","pdNodeId":"38","nodeId":"n_0_38"},{"nodeClass":"control","patchId":"0","pdNodeId":"39","nodeId":"n_0_39"},{"nodeClass":"control","patchId":"0","pdNodeId":"40","nodeId":"n_0_40"},{"nodeClass":"control","patchId":"0","pdNodeId":"43","nodeId":"n_0_43"},{"nodeClass":"control","patchId":"0","pdNodeId":"45","nodeId":"n_0_45"},{"nodeClass":"control","patchId":"0","pdNodeId":"46","nodeId":"n_0_46"},{"nodeClass":"control","patchId":"0","pdNodeId":"48","nodeId":"n_0_48"},{"nodeClass":"control","patchId":"0","pdNodeId":"51","nodeId":"n_0_51"},{"nodeClass":"control","patchId":"0","pdNodeId":"56","nodeId":"n_0_56"},{"nodeClass":"control","patchId":"0","pdNodeId":"61","nodeId":"n_0_61"},{"nodeClass":"control","patchId":"0","pdNodeId":"62","nodeId":"n_0_62"},{"nodeClass":"control","patchId":"0","pdNodeId":"63","nodeId":"n_0_63"},{"nodeClass":"control","patchId":"0","pdNodeId":"64","nodeId":"n_0_64"},{"nodeClass":"control","patchId":"0","pdNodeId":"65","nodeId":"n_0_65"},{"nodeClass":"control","patchId":"0","pdNodeId":"66","nodeId":"n_0_66"},{"nodeClass":"control","patchId":"0","pdNodeId":"67","nodeId":"n_0_67"},{"nodeClass":"control","patchId":"0","pdNodeId":"68","nodeId":"n_0_68"}]},"settings":{"audio":{"bitDepth":64,"channelCount":{"in":2,"out":2},"sampleRate":0,"blockSize":0},"io":{"messageReceivers":{"n_0_0":["0"],"n_0_1":["0"],"n_0_4":["0"],"n_0_6":["0"],"n_0_7":["0"],"n_0_9":["0"],"n_0_13":["0"],"n_0_14":["0"],"n_0_17":["0"],"n_0_19":["0"],"n_0_20":["0"],"n_0_22":["0"],"n_0_25":["0"],"n_0_26":["0"],"n_0_27":["0"],"n_0_30":["0"],"n_0_32":["0"],"n_0_33":["0"],"n_0_35":["0"],"n_0_38":["0"],"n_0_39":["0"],"n_0_40":["0"],"n_0_43":["0"],"n_0_45":["0"],"n_0_46":["0"],"n_0_48":["0"],"n_0_51":["0"],"n_0_56":["0"],"n_0_61":["0"],"n_0_62":["0"],"n_0_63":["0"],"n_0_64":["0"],"n_0_65":["0"],"n_0_66":["0"],"n_0_67":["0"],"n_0_68":["0"]},"messageSenders":{"n_0_0":["0"],"n_0_1":["0"],"n_0_4":["0"],"n_0_6":["0"],"n_0_7":["0"],"n_0_9":["0"],"n_0_13":["0"],"n_0_14":["0"],"n_0_17":["0"],"n_0_19":["0"],"n_0_20":["0"],"n_0_22":["0"],"n_0_25":["0"],"n_0_26":["0"],"n_0_27":["0"],"n_0_30":["0"],"n_0_32":["0"],"n_0_33":["0"],"n_0_35":["0"],"n_0_38":["0"],"n_0_39":["0"],"n_0_40":["0"],"n_0_43":["0"],"n_0_45":["0"],"n_0_46":["0"],"n_0_48":["0"],"n_0_51":["0"],"n_0_56":["0"],"n_0_61":["0"],"n_0_62":["0"],"n_0_63":["0"],"n_0_64":["0"],"n_0_65":["0"],"n_0_66":["0"],"n_0_67":["0"],"n_0_68":["0"]}}},"compilation":{"variableNamesIndex":{"io":{"messageReceivers":{"n_0_0":{"0":"IO_rcv_n_0_0_0"},"n_0_1":{"0":"IO_rcv_n_0_1_0"},"n_0_4":{"0":"IO_rcv_n_0_4_0"},"n_0_6":{"0":"IO_rcv_n_0_6_0"},"n_0_7":{"0":"IO_rcv_n_0_7_0"},"n_0_9":{"0":"IO_rcv_n_0_9_0"},"n_0_13":{"0":"IO_rcv_n_0_13_0"},"n_0_14":{"0":"IO_rcv_n_0_14_0"},"n_0_17":{"0":"IO_rcv_n_0_17_0"},"n_0_19":{"0":"IO_rcv_n_0_19_0"},"n_0_20":{"0":"IO_rcv_n_0_20_0"},"n_0_22":{"0":"IO_rcv_n_0_22_0"},"n_0_25":{"0":"IO_rcv_n_0_25_0"},"n_0_26":{"0":"IO_rcv_n_0_26_0"},"n_0_27":{"0":"IO_rcv_n_0_27_0"},"n_0_30":{"0":"IO_rcv_n_0_30_0"},"n_0_32":{"0":"IO_rcv_n_0_32_0"},"n_0_33":{"0":"IO_rcv_n_0_33_0"},"n_0_35":{"0":"IO_rcv_n_0_35_0"},"n_0_38":{"0":"IO_rcv_n_0_38_0"},"n_0_39":{"0":"IO_rcv_n_0_39_0"},"n_0_40":{"0":"IO_rcv_n_0_40_0"},"n_0_43":{"0":"IO_rcv_n_0_43_0"},"n_0_45":{"0":"IO_rcv_n_0_45_0"},"n_0_46":{"0":"IO_rcv_n_0_46_0"},"n_0_48":{"0":"IO_rcv_n_0_48_0"},"n_0_51":{"0":"IO_rcv_n_0_51_0"},"n_0_56":{"0":"IO_rcv_n_0_56_0"},"n_0_61":{"0":"IO_rcv_n_0_61_0"},"n_0_62":{"0":"IO_rcv_n_0_62_0"},"n_0_63":{"0":"IO_rcv_n_0_63_0"},"n_0_64":{"0":"IO_rcv_n_0_64_0"},"n_0_65":{"0":"IO_rcv_n_0_65_0"},"n_0_66":{"0":"IO_rcv_n_0_66_0"},"n_0_67":{"0":"IO_rcv_n_0_67_0"},"n_0_68":{"0":"IO_rcv_n_0_68_0"}},"messageSenders":{"n_0_0":{"0":"IO_snd_n_0_0_0"},"n_0_1":{"0":"IO_snd_n_0_1_0"},"n_0_4":{"0":"IO_snd_n_0_4_0"},"n_0_6":{"0":"IO_snd_n_0_6_0"},"n_0_7":{"0":"IO_snd_n_0_7_0"},"n_0_9":{"0":"IO_snd_n_0_9_0"},"n_0_13":{"0":"IO_snd_n_0_13_0"},"n_0_14":{"0":"IO_snd_n_0_14_0"},"n_0_17":{"0":"IO_snd_n_0_17_0"},"n_0_19":{"0":"IO_snd_n_0_19_0"},"n_0_20":{"0":"IO_snd_n_0_20_0"},"n_0_22":{"0":"IO_snd_n_0_22_0"},"n_0_25":{"0":"IO_snd_n_0_25_0"},"n_0_26":{"0":"IO_snd_n_0_26_0"},"n_0_27":{"0":"IO_snd_n_0_27_0"},"n_0_30":{"0":"IO_snd_n_0_30_0"},"n_0_32":{"0":"IO_snd_n_0_32_0"},"n_0_33":{"0":"IO_snd_n_0_33_0"},"n_0_35":{"0":"IO_snd_n_0_35_0"},"n_0_38":{"0":"IO_snd_n_0_38_0"},"n_0_39":{"0":"IO_snd_n_0_39_0"},"n_0_40":{"0":"IO_snd_n_0_40_0"},"n_0_43":{"0":"IO_snd_n_0_43_0"},"n_0_45":{"0":"IO_snd_n_0_45_0"},"n_0_46":{"0":"IO_snd_n_0_46_0"},"n_0_48":{"0":"IO_snd_n_0_48_0"},"n_0_51":{"0":"IO_snd_n_0_51_0"},"n_0_56":{"0":"IO_snd_n_0_56_0"},"n_0_61":{"0":"IO_snd_n_0_61_0"},"n_0_62":{"0":"IO_snd_n_0_62_0"},"n_0_63":{"0":"IO_snd_n_0_63_0"},"n_0_64":{"0":"IO_snd_n_0_64_0"},"n_0_65":{"0":"IO_snd_n_0_65_0"},"n_0_66":{"0":"IO_snd_n_0_66_0"},"n_0_67":{"0":"IO_snd_n_0_67_0"},"n_0_68":{"0":"IO_snd_n_0_68_0"}}},"globals":{"commons":{"getArray":"G_commons_getArray","setArray":"G_commons_setArray"}}}}},
            initialize: (sampleRate, blockSize) => {
                exports.metadata.settings.audio.sampleRate = sampleRate
                exports.metadata.settings.audio.blockSize = blockSize
                SAMPLE_RATE = sampleRate
                BLOCK_SIZE = blockSize

                
                N_n_0_0_state.messageSender = N_n_0_0_snds_0
                N_n_0_0_state.messageReceiver = function (m) {
                    NT_tgl_receiveMessage(N_n_0_0_state, m)
                }
                NT_tgl_setReceiveBusName(N_n_0_0_state, "empty")
    
                
            

            N_n_0_52_state.snd0 = N_n_0_1_rcvs_0
            N_n_0_52_state.sampleRatio = computeUnitInSamples(SAMPLE_RATE, 1, "msec")
            NT_metro_setRate(N_n_0_52_state, 8000)
            N_n_0_52_state.tickCallback = function () {
                NT_metro_scheduleNextTick(N_n_0_52_state)
            }
        

        N_n_0_1_state.messageReceiver = function (m) {
            NT_bang_receiveMessage(N_n_0_1_state, m)
        }
        N_n_0_1_state.messageSender = N_n_0_1_snds_0
        NT_bang_setReceiveBusName(N_n_0_1_state, "empty")

        
    

            N_n_0_7_state.msgSpecs = [
                
                    {
                        transferFunction: function (inMessage) {
                            
                            return N_n_0_7_state.msgSpecs[0].outMessage
                        },
                        outTemplate: [],
                        outMessage: G_msg_EMPTY_MESSAGE,
                        send: "",
                        hasSend: false,
                    },
            ]

            
        
        
        
    
N_n_0_7_state.msgSpecs[0].outTemplate = []

                N_n_0_7_state.msgSpecs[0].outTemplate.push(G_msg_FLOAT_TOKEN)
            

                N_n_0_7_state.msgSpecs[0].outTemplate.push(G_msg_FLOAT_TOKEN)
            
N_n_0_7_state.msgSpecs[0].outMessage = G_msg_create(N_n_0_7_state.msgSpecs[0].outTemplate)

                G_msg_writeFloatToken(N_n_0_7_state.msgSpecs[0].outMessage, 0, 1)
            

                G_msg_writeFloatToken(N_n_0_7_state.msgSpecs[0].outMessage, 1, 300)
            
        

            NT_line_setGrain(N_n_0_8_state, 20)
            N_n_0_8_state.snd0 = N_n_0_9_rcvs_0
            N_n_0_8_state.tickCallback = function () {
                NT_line_tick(N_n_0_8_state)
            }
        

            N_n_0_9_state.messageReceiver = function (m) {
                NT_floatatom_receiveMessage(N_n_0_9_state, m)
            }
            N_n_0_9_state.messageSender = N_n_0_9_snds_0
            NT_floatatom_setReceiveBusName(N_n_0_9_state, "empty")
        





        N_n_0_57_state.sampleRatio = computeUnitInSamples(SAMPLE_RATE, 1, "msec")
        NT_delay_setDelay(N_n_0_57_state, 0)
    

            N_n_0_65_state.msgSpecs = [
                
                    {
                        transferFunction: function (inMessage) {
                            
                            return N_n_0_65_state.msgSpecs[0].outMessage
                        },
                        outTemplate: [],
                        outMessage: G_msg_EMPTY_MESSAGE,
                        send: "",
                        hasSend: false,
                    },
            ]

            
        
        
        
    
N_n_0_65_state.msgSpecs[0].outTemplate = []

                N_n_0_65_state.msgSpecs[0].outTemplate.push(G_msg_FLOAT_TOKEN)
            

                N_n_0_65_state.msgSpecs[0].outTemplate.push(G_msg_FLOAT_TOKEN)
            
N_n_0_65_state.msgSpecs[0].outMessage = G_msg_create(N_n_0_65_state.msgSpecs[0].outTemplate)

                G_msg_writeFloatToken(N_n_0_65_state.msgSpecs[0].outMessage, 0, 0)
            

                G_msg_writeFloatToken(N_n_0_65_state.msgSpecs[0].outMessage, 1, 400)
            
        




            N_n_0_4_state.messageReceiver = function (m) {
                NT_floatatom_receiveMessage(N_n_0_4_state, m)
            }
            N_n_0_4_state.messageSender = N_n_0_4_snds_0
            NT_floatatom_setReceiveBusName(N_n_0_4_state, "empty")
        


            N_n_0_6_state.messageReceiver = function (m) {
                NT_floatatom_receiveMessage(N_n_0_6_state, m)
            }
            N_n_0_6_state.messageSender = N_n_0_6_snds_0
            NT_floatatom_setReceiveBusName(N_n_0_6_state, "empty")
        





                N_n_0_13_state.messageSender = N_n_0_13_snds_0
                N_n_0_13_state.messageReceiver = function (m) {
                    NT_tgl_receiveMessage(N_n_0_13_state, m)
                }
                NT_tgl_setReceiveBusName(N_n_0_13_state, "empty")
    
                
            

            N_n_0_53_state.snd0 = N_n_0_14_rcvs_0
            N_n_0_53_state.sampleRatio = computeUnitInSamples(SAMPLE_RATE, 1, "msec")
            NT_metro_setRate(N_n_0_53_state, 8000)
            N_n_0_53_state.tickCallback = function () {
                NT_metro_scheduleNextTick(N_n_0_53_state)
            }
        

        N_n_0_14_state.messageReceiver = function (m) {
            NT_bang_receiveMessage(N_n_0_14_state, m)
        }
        N_n_0_14_state.messageSender = N_n_0_14_snds_0
        NT_bang_setReceiveBusName(N_n_0_14_state, "empty")

        
    

            N_n_0_20_state.msgSpecs = [
                
                    {
                        transferFunction: function (inMessage) {
                            
                            return N_n_0_20_state.msgSpecs[0].outMessage
                        },
                        outTemplate: [],
                        outMessage: G_msg_EMPTY_MESSAGE,
                        send: "",
                        hasSend: false,
                    },
            ]

            
        
        
        
    
N_n_0_20_state.msgSpecs[0].outTemplate = []

                N_n_0_20_state.msgSpecs[0].outTemplate.push(G_msg_FLOAT_TOKEN)
            

                N_n_0_20_state.msgSpecs[0].outTemplate.push(G_msg_FLOAT_TOKEN)
            
N_n_0_20_state.msgSpecs[0].outMessage = G_msg_create(N_n_0_20_state.msgSpecs[0].outTemplate)

                G_msg_writeFloatToken(N_n_0_20_state.msgSpecs[0].outMessage, 0, 1)
            

                G_msg_writeFloatToken(N_n_0_20_state.msgSpecs[0].outMessage, 1, 300)
            
        

            NT_line_setGrain(N_n_0_21_state, 20)
            N_n_0_21_state.snd0 = N_n_0_22_rcvs_0
            N_n_0_21_state.tickCallback = function () {
                NT_line_tick(N_n_0_21_state)
            }
        

            N_n_0_22_state.messageReceiver = function (m) {
                NT_floatatom_receiveMessage(N_n_0_22_state, m)
            }
            N_n_0_22_state.messageSender = N_n_0_22_snds_0
            NT_floatatom_setReceiveBusName(N_n_0_22_state, "empty")
        





        N_n_0_58_state.sampleRatio = computeUnitInSamples(SAMPLE_RATE, 1, "msec")
        NT_delay_setDelay(N_n_0_58_state, 0)
    

            N_n_0_66_state.msgSpecs = [
                
                    {
                        transferFunction: function (inMessage) {
                            
                            return N_n_0_66_state.msgSpecs[0].outMessage
                        },
                        outTemplate: [],
                        outMessage: G_msg_EMPTY_MESSAGE,
                        send: "",
                        hasSend: false,
                    },
            ]

            
        
        
        
    
N_n_0_66_state.msgSpecs[0].outTemplate = []

                N_n_0_66_state.msgSpecs[0].outTemplate.push(G_msg_FLOAT_TOKEN)
            

                N_n_0_66_state.msgSpecs[0].outTemplate.push(G_msg_FLOAT_TOKEN)
            
N_n_0_66_state.msgSpecs[0].outMessage = G_msg_create(N_n_0_66_state.msgSpecs[0].outTemplate)

                G_msg_writeFloatToken(N_n_0_66_state.msgSpecs[0].outMessage, 0, 0)
            

                G_msg_writeFloatToken(N_n_0_66_state.msgSpecs[0].outMessage, 1, 400)
            
        




            N_n_0_17_state.messageReceiver = function (m) {
                NT_floatatom_receiveMessage(N_n_0_17_state, m)
            }
            N_n_0_17_state.messageSender = N_n_0_17_snds_0
            NT_floatatom_setReceiveBusName(N_n_0_17_state, "empty")
        


            N_n_0_19_state.messageReceiver = function (m) {
                NT_floatatom_receiveMessage(N_n_0_19_state, m)
            }
            N_n_0_19_state.messageSender = N_n_0_19_snds_0
            NT_floatatom_setReceiveBusName(N_n_0_19_state, "empty")
        





            N_n_0_25_state.messageReceiver = function (m) {
                NT_floatatom_receiveMessage(N_n_0_25_state, m)
            }
            N_n_0_25_state.messageSender = N_n_0_25_snds_0
            NT_floatatom_setReceiveBusName(N_n_0_25_state, "empty")
        


                N_n_0_26_state.messageSender = N_n_0_26_snds_0
                N_n_0_26_state.messageReceiver = function (m) {
                    NT_tgl_receiveMessage(N_n_0_26_state, m)
                }
                NT_tgl_setReceiveBusName(N_n_0_26_state, "empty")
    
                
            

            N_n_0_54_state.snd0 = N_n_0_27_rcvs_0
            N_n_0_54_state.sampleRatio = computeUnitInSamples(SAMPLE_RATE, 1, "msec")
            NT_metro_setRate(N_n_0_54_state, 8000)
            N_n_0_54_state.tickCallback = function () {
                NT_metro_scheduleNextTick(N_n_0_54_state)
            }
        

        N_n_0_27_state.messageReceiver = function (m) {
            NT_bang_receiveMessage(N_n_0_27_state, m)
        }
        N_n_0_27_state.messageSender = N_n_0_27_snds_0
        NT_bang_setReceiveBusName(N_n_0_27_state, "empty")

        
    

            N_n_0_33_state.msgSpecs = [
                
                    {
                        transferFunction: function (inMessage) {
                            
                            return N_n_0_33_state.msgSpecs[0].outMessage
                        },
                        outTemplate: [],
                        outMessage: G_msg_EMPTY_MESSAGE,
                        send: "",
                        hasSend: false,
                    },
            ]

            
        
        
        
    
N_n_0_33_state.msgSpecs[0].outTemplate = []

                N_n_0_33_state.msgSpecs[0].outTemplate.push(G_msg_FLOAT_TOKEN)
            

                N_n_0_33_state.msgSpecs[0].outTemplate.push(G_msg_FLOAT_TOKEN)
            
N_n_0_33_state.msgSpecs[0].outMessage = G_msg_create(N_n_0_33_state.msgSpecs[0].outTemplate)

                G_msg_writeFloatToken(N_n_0_33_state.msgSpecs[0].outMessage, 0, 1)
            

                G_msg_writeFloatToken(N_n_0_33_state.msgSpecs[0].outMessage, 1, 300)
            
        

            NT_line_setGrain(N_n_0_34_state, 20)
            N_n_0_34_state.snd0 = N_n_0_35_rcvs_0
            N_n_0_34_state.tickCallback = function () {
                NT_line_tick(N_n_0_34_state)
            }
        

            N_n_0_35_state.messageReceiver = function (m) {
                NT_floatatom_receiveMessage(N_n_0_35_state, m)
            }
            N_n_0_35_state.messageSender = N_n_0_35_snds_0
            NT_floatatom_setReceiveBusName(N_n_0_35_state, "empty")
        





        N_n_0_59_state.sampleRatio = computeUnitInSamples(SAMPLE_RATE, 1, "msec")
        NT_delay_setDelay(N_n_0_59_state, 0)
    

            N_n_0_67_state.msgSpecs = [
                
                    {
                        transferFunction: function (inMessage) {
                            
                            return N_n_0_67_state.msgSpecs[0].outMessage
                        },
                        outTemplate: [],
                        outMessage: G_msg_EMPTY_MESSAGE,
                        send: "",
                        hasSend: false,
                    },
            ]

            
        
        
        
    
N_n_0_67_state.msgSpecs[0].outTemplate = []

                N_n_0_67_state.msgSpecs[0].outTemplate.push(G_msg_FLOAT_TOKEN)
            

                N_n_0_67_state.msgSpecs[0].outTemplate.push(G_msg_FLOAT_TOKEN)
            
N_n_0_67_state.msgSpecs[0].outMessage = G_msg_create(N_n_0_67_state.msgSpecs[0].outTemplate)

                G_msg_writeFloatToken(N_n_0_67_state.msgSpecs[0].outMessage, 0, 0)
            

                G_msg_writeFloatToken(N_n_0_67_state.msgSpecs[0].outMessage, 1, 400)
            
        




            N_n_0_30_state.messageReceiver = function (m) {
                NT_floatatom_receiveMessage(N_n_0_30_state, m)
            }
            N_n_0_30_state.messageSender = N_n_0_30_snds_0
            NT_floatatom_setReceiveBusName(N_n_0_30_state, "empty")
        


            N_n_0_32_state.messageReceiver = function (m) {
                NT_floatatom_receiveMessage(N_n_0_32_state, m)
            }
            N_n_0_32_state.messageSender = N_n_0_32_snds_0
            NT_floatatom_setReceiveBusName(N_n_0_32_state, "empty")
        





            N_n_0_38_state.messageReceiver = function (m) {
                NT_floatatom_receiveMessage(N_n_0_38_state, m)
            }
            N_n_0_38_state.messageSender = N_n_0_38_snds_0
            NT_floatatom_setReceiveBusName(N_n_0_38_state, "empty")
        


                N_n_0_39_state.messageSender = N_n_0_39_snds_0
                N_n_0_39_state.messageReceiver = function (m) {
                    NT_tgl_receiveMessage(N_n_0_39_state, m)
                }
                NT_tgl_setReceiveBusName(N_n_0_39_state, "empty")
    
                
            

            N_n_0_55_state.snd0 = N_n_0_40_rcvs_0
            N_n_0_55_state.sampleRatio = computeUnitInSamples(SAMPLE_RATE, 1, "msec")
            NT_metro_setRate(N_n_0_55_state, 8000)
            N_n_0_55_state.tickCallback = function () {
                NT_metro_scheduleNextTick(N_n_0_55_state)
            }
        

        N_n_0_40_state.messageReceiver = function (m) {
            NT_bang_receiveMessage(N_n_0_40_state, m)
        }
        N_n_0_40_state.messageSender = N_n_0_40_snds_0
        NT_bang_setReceiveBusName(N_n_0_40_state, "empty")

        
    

            N_n_0_46_state.msgSpecs = [
                
                    {
                        transferFunction: function (inMessage) {
                            
                            return N_n_0_46_state.msgSpecs[0].outMessage
                        },
                        outTemplate: [],
                        outMessage: G_msg_EMPTY_MESSAGE,
                        send: "",
                        hasSend: false,
                    },
            ]

            
        
        
        
    
N_n_0_46_state.msgSpecs[0].outTemplate = []

                N_n_0_46_state.msgSpecs[0].outTemplate.push(G_msg_FLOAT_TOKEN)
            

                N_n_0_46_state.msgSpecs[0].outTemplate.push(G_msg_FLOAT_TOKEN)
            
N_n_0_46_state.msgSpecs[0].outMessage = G_msg_create(N_n_0_46_state.msgSpecs[0].outTemplate)

                G_msg_writeFloatToken(N_n_0_46_state.msgSpecs[0].outMessage, 0, 1)
            

                G_msg_writeFloatToken(N_n_0_46_state.msgSpecs[0].outMessage, 1, 300)
            
        

            NT_line_setGrain(N_n_0_47_state, 20)
            N_n_0_47_state.snd0 = N_n_0_48_rcvs_0
            N_n_0_47_state.tickCallback = function () {
                NT_line_tick(N_n_0_47_state)
            }
        

            N_n_0_48_state.messageReceiver = function (m) {
                NT_floatatom_receiveMessage(N_n_0_48_state, m)
            }
            N_n_0_48_state.messageSender = N_n_0_48_snds_0
            NT_floatatom_setReceiveBusName(N_n_0_48_state, "empty")
        





        N_n_0_60_state.sampleRatio = computeUnitInSamples(SAMPLE_RATE, 1, "msec")
        NT_delay_setDelay(N_n_0_60_state, 0)
    

            N_n_0_68_state.msgSpecs = [
                
                    {
                        transferFunction: function (inMessage) {
                            
                            return N_n_0_68_state.msgSpecs[0].outMessage
                        },
                        outTemplate: [],
                        outMessage: G_msg_EMPTY_MESSAGE,
                        send: "",
                        hasSend: false,
                    },
            ]

            
        
        
        
    
N_n_0_68_state.msgSpecs[0].outTemplate = []

                N_n_0_68_state.msgSpecs[0].outTemplate.push(G_msg_FLOAT_TOKEN)
            

                N_n_0_68_state.msgSpecs[0].outTemplate.push(G_msg_FLOAT_TOKEN)
            
N_n_0_68_state.msgSpecs[0].outMessage = G_msg_create(N_n_0_68_state.msgSpecs[0].outTemplate)

                G_msg_writeFloatToken(N_n_0_68_state.msgSpecs[0].outMessage, 0, 0)
            

                G_msg_writeFloatToken(N_n_0_68_state.msgSpecs[0].outMessage, 1, 400)
            
        




            N_n_0_43_state.messageReceiver = function (m) {
                NT_floatatom_receiveMessage(N_n_0_43_state, m)
            }
            N_n_0_43_state.messageSender = N_n_0_43_snds_0
            NT_floatatom_setReceiveBusName(N_n_0_43_state, "empty")
        


            N_n_0_45_state.messageReceiver = function (m) {
                NT_floatatom_receiveMessage(N_n_0_45_state, m)
            }
            N_n_0_45_state.messageSender = N_n_0_45_snds_0
            NT_floatatom_setReceiveBusName(N_n_0_45_state, "empty")
        





            N_n_0_51_state.messageReceiver = function (m) {
                NT_floatatom_receiveMessage(N_n_0_51_state, m)
            }
            N_n_0_51_state.messageSender = N_n_0_51_snds_0
            NT_floatatom_setReceiveBusName(N_n_0_51_state, "empty")
        


            N_n_0_56_state.messageReceiver = function (m) {
                NT_floatatom_receiveMessage(N_n_0_56_state, m)
            }
            N_n_0_56_state.messageSender = N_n_0_56_snds_0
            NT_floatatom_setReceiveBusName(N_n_0_56_state, "empty")
        


            N_n_0_61_state.messageReceiver = function (m) {
                NT_floatatom_receiveMessage(N_n_0_61_state, m)
            }
            N_n_0_61_state.messageSender = N_n_0_61_snds_0
            NT_floatatom_setReceiveBusName(N_n_0_61_state, "empty")
        


            N_n_0_62_state.messageReceiver = function (m) {
                NT_floatatom_receiveMessage(N_n_0_62_state, m)
            }
            N_n_0_62_state.messageSender = N_n_0_62_snds_0
            NT_floatatom_setReceiveBusName(N_n_0_62_state, "empty")
        


            N_n_0_63_state.messageReceiver = function (m) {
                NT_floatatom_receiveMessage(N_n_0_63_state, m)
            }
            N_n_0_63_state.messageSender = N_n_0_63_snds_0
            NT_floatatom_setReceiveBusName(N_n_0_63_state, "empty")
        


            N_n_0_64_state.messageReceiver = function (m) {
                NT_floatatom_receiveMessage(N_n_0_64_state, m)
            }
            N_n_0_64_state.messageSender = N_n_0_64_snds_0
            NT_floatatom_setReceiveBusName(N_n_0_64_state, "empty")
        






































            NT_phasor_t_setStep(N_n_0_2_state, 0)
        




        NT_throw_t_setBusName(N_n_0_11_state, "out")
    

            NT_phasor_t_setStep(N_n_0_15_state, 0)
        




        NT_throw_t_setBusName(N_n_0_24_state, "out")
    

            NT_phasor_t_setStep(N_n_0_28_state, 0)
        




        NT_throw_t_setBusName(N_n_0_37_state, "out")
    

            NT_phasor_t_setStep(N_n_0_41_state, 0)
        




        NT_throw_t_setBusName(N_n_0_50_state, "out")
    

        NT_catch_t_setBusName(N_n_0_12_state, "out")
    





                COLD_0(G_msg_EMPTY_MESSAGE)
COLD_1(G_msg_EMPTY_MESSAGE)
COLD_2(G_msg_EMPTY_MESSAGE)
COLD_3(G_msg_EMPTY_MESSAGE)
COLD_4(G_msg_EMPTY_MESSAGE)
COLD_5(G_msg_EMPTY_MESSAGE)
COLD_6(G_msg_EMPTY_MESSAGE)
COLD_7(G_msg_EMPTY_MESSAGE)
COLD_8(G_msg_EMPTY_MESSAGE)
            },
            dspLoop: (INPUT, OUTPUT) => {
                
        for (IT_FRAME = 0; IT_FRAME < BLOCK_SIZE; IT_FRAME++) {
            G_commons__emitFrame(FRAME)
            
                N_n_0_2_outs_0 = N_n_0_2_state.phase % 1
                N_n_0_2_state.phase += N_n_0_2_state.step
            
N_n_0_3_state.previous = N_n_0_3_outs_0 = N_n_0_3_state.coeff * N_n_0_2_outs_0 + (1 - N_n_0_3_state.coeff) * N_n_0_3_state.previous

        G_sigBuses_addAssign(N_n_0_11_state.busName, (N_n_0_3_outs_0 * (N_m_n_0_10_1_sig_state.currentValue)))
    

                N_n_0_15_outs_0 = N_n_0_15_state.phase % 1
                N_n_0_15_state.phase += N_n_0_15_state.step
            
N_n_0_16_state.previous = N_n_0_16_outs_0 = N_n_0_16_state.coeff * N_n_0_15_outs_0 + (1 - N_n_0_16_state.coeff) * N_n_0_16_state.previous

        G_sigBuses_addAssign(N_n_0_24_state.busName, (N_n_0_16_outs_0 * (N_m_n_0_23_1_sig_state.currentValue)))
    

                N_n_0_28_outs_0 = N_n_0_28_state.phase % 1
                N_n_0_28_state.phase += N_n_0_28_state.step
            
N_n_0_29_state.previous = N_n_0_29_outs_0 = N_n_0_29_state.coeff * N_n_0_28_outs_0 + (1 - N_n_0_29_state.coeff) * N_n_0_29_state.previous

        G_sigBuses_addAssign(N_n_0_37_state.busName, (N_n_0_29_outs_0 * (N_m_n_0_36_1_sig_state.currentValue)))
    

                N_n_0_41_outs_0 = N_n_0_41_state.phase % 1
                N_n_0_41_state.phase += N_n_0_41_state.step
            
N_n_0_42_state.previous = N_n_0_42_outs_0 = N_n_0_42_state.coeff * N_n_0_41_outs_0 + (1 - N_n_0_42_state.coeff) * N_n_0_42_state.previous

        G_sigBuses_addAssign(N_n_0_50_state.busName, (N_n_0_42_outs_0 * (N_m_n_0_49_1_sig_state.currentValue)))
    

        N_n_0_12_outs_0 = G_sigBuses_read(N_n_0_12_state.busName)
        G_sigBuses_reset(N_n_0_12_state.busName)
    
N_n_0_70_state.previous = N_n_0_70_outs_0 = N_n_0_70_state.coeff * N_n_0_12_outs_0 + (1 - N_n_0_70_state.coeff) * N_n_0_70_state.previous
N_n_0_71_outs_0 = N_n_0_70_outs_0 * (N_m_n_0_71_1_sig_state.currentValue)
OUTPUT[0][IT_FRAME] = N_n_0_71_outs_0
OUTPUT[1][IT_FRAME] = N_n_0_71_outs_0
            FRAME++
        }
    
            },
            io: {
                messageReceivers: {
                    n_0_0: {
                            "0": IO_rcv_n_0_0_0,
                        },
n_0_1: {
                            "0": IO_rcv_n_0_1_0,
                        },
n_0_4: {
                            "0": IO_rcv_n_0_4_0,
                        },
n_0_6: {
                            "0": IO_rcv_n_0_6_0,
                        },
n_0_7: {
                            "0": IO_rcv_n_0_7_0,
                        },
n_0_9: {
                            "0": IO_rcv_n_0_9_0,
                        },
n_0_13: {
                            "0": IO_rcv_n_0_13_0,
                        },
n_0_14: {
                            "0": IO_rcv_n_0_14_0,
                        },
n_0_17: {
                            "0": IO_rcv_n_0_17_0,
                        },
n_0_19: {
                            "0": IO_rcv_n_0_19_0,
                        },
n_0_20: {
                            "0": IO_rcv_n_0_20_0,
                        },
n_0_22: {
                            "0": IO_rcv_n_0_22_0,
                        },
n_0_25: {
                            "0": IO_rcv_n_0_25_0,
                        },
n_0_26: {
                            "0": IO_rcv_n_0_26_0,
                        },
n_0_27: {
                            "0": IO_rcv_n_0_27_0,
                        },
n_0_30: {
                            "0": IO_rcv_n_0_30_0,
                        },
n_0_32: {
                            "0": IO_rcv_n_0_32_0,
                        },
n_0_33: {
                            "0": IO_rcv_n_0_33_0,
                        },
n_0_35: {
                            "0": IO_rcv_n_0_35_0,
                        },
n_0_38: {
                            "0": IO_rcv_n_0_38_0,
                        },
n_0_39: {
                            "0": IO_rcv_n_0_39_0,
                        },
n_0_40: {
                            "0": IO_rcv_n_0_40_0,
                        },
n_0_43: {
                            "0": IO_rcv_n_0_43_0,
                        },
n_0_45: {
                            "0": IO_rcv_n_0_45_0,
                        },
n_0_46: {
                            "0": IO_rcv_n_0_46_0,
                        },
n_0_48: {
                            "0": IO_rcv_n_0_48_0,
                        },
n_0_51: {
                            "0": IO_rcv_n_0_51_0,
                        },
n_0_56: {
                            "0": IO_rcv_n_0_56_0,
                        },
n_0_61: {
                            "0": IO_rcv_n_0_61_0,
                        },
n_0_62: {
                            "0": IO_rcv_n_0_62_0,
                        },
n_0_63: {
                            "0": IO_rcv_n_0_63_0,
                        },
n_0_64: {
                            "0": IO_rcv_n_0_64_0,
                        },
n_0_65: {
                            "0": IO_rcv_n_0_65_0,
                        },
n_0_66: {
                            "0": IO_rcv_n_0_66_0,
                        },
n_0_67: {
                            "0": IO_rcv_n_0_67_0,
                        },
n_0_68: {
                            "0": IO_rcv_n_0_68_0,
                        },
                },
                messageSenders: {
                    n_0_0: {
                            "0": () => undefined,
                        },
n_0_1: {
                            "0": () => undefined,
                        },
n_0_4: {
                            "0": () => undefined,
                        },
n_0_6: {
                            "0": () => undefined,
                        },
n_0_7: {
                            "0": () => undefined,
                        },
n_0_9: {
                            "0": () => undefined,
                        },
n_0_13: {
                            "0": () => undefined,
                        },
n_0_14: {
                            "0": () => undefined,
                        },
n_0_17: {
                            "0": () => undefined,
                        },
n_0_19: {
                            "0": () => undefined,
                        },
n_0_20: {
                            "0": () => undefined,
                        },
n_0_22: {
                            "0": () => undefined,
                        },
n_0_25: {
                            "0": () => undefined,
                        },
n_0_26: {
                            "0": () => undefined,
                        },
n_0_27: {
                            "0": () => undefined,
                        },
n_0_30: {
                            "0": () => undefined,
                        },
n_0_32: {
                            "0": () => undefined,
                        },
n_0_33: {
                            "0": () => undefined,
                        },
n_0_35: {
                            "0": () => undefined,
                        },
n_0_38: {
                            "0": () => undefined,
                        },
n_0_39: {
                            "0": () => undefined,
                        },
n_0_40: {
                            "0": () => undefined,
                        },
n_0_43: {
                            "0": () => undefined,
                        },
n_0_45: {
                            "0": () => undefined,
                        },
n_0_46: {
                            "0": () => undefined,
                        },
n_0_48: {
                            "0": () => undefined,
                        },
n_0_51: {
                            "0": () => undefined,
                        },
n_0_56: {
                            "0": () => undefined,
                        },
n_0_61: {
                            "0": () => undefined,
                        },
n_0_62: {
                            "0": () => undefined,
                        },
n_0_63: {
                            "0": () => undefined,
                        },
n_0_64: {
                            "0": () => undefined,
                        },
n_0_65: {
                            "0": () => undefined,
                        },
n_0_66: {
                            "0": () => undefined,
                        },
n_0_67: {
                            "0": () => undefined,
                        },
n_0_68: {
                            "0": () => undefined,
                        },
                },
            }
        }

        
exports.G_commons_getArray = G_commons_getArray
exports.G_commons_setArray = G_commons_setArray
    