module Data exposing
    ( CurrentStatus(..)
    , Direction(..)
    , Stop
    , Vehicle
    )


type alias Stop =
    { id : String
    , name : String
    }


type alias Vehicle =
    { label : String
    , route : String
    , direction : Direction
    , currentStatus : CurrentStatus
    , stationId : String
    , newFlag : Bool
    }


{-| The API gives this as 0 or 1, but for us,
it will be easier to think about them as up and down on the screen.
For all the Subway lines as we want to draw them,
0 is Downward (Red/Orange: South, Green: West)
1 is Upward (Red/Orange: North, Green: East)
-}
type Direction
    = Upward
    | Downward


type CurrentStatus
    = InTransitTo
    | StoppedAt
