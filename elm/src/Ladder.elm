module Ladder exposing
    ( Ladder
    , LadderRow
    , ladder
    )

import Data exposing (..)


type alias Ladder =
    List LadderRow


{-| A row for each station and each space inbetween stations.
Stations have a name. Spaces between do not.
-}
type alias LadderRow =
    { leftTrains : List Vehicle
    , rightTrains : List Vehicle
    , stopName : Maybe String
    }


{-| All the places on the route a train might show up
-}
type alias Location =
    { direction : Direction
    , stationId : String
    , currentStatus : CurrentStatus
    }


{-| Stops should be given top-to-bottom
If there are multiple trains in one location, picks one arbitrarily
-}
ladder : List Stop -> List Vehicle -> Ladder
ladder stops vehicles =
    let
        {- Note the directions and the assymetries between going up and going down:
           foldl vs foldr,
           the order that approachingLocation and stopLocation are accumulated,
           that the extra approaching segment is at the head of the list so it can be dropped,
           that only the upward list needs be reversed.
        -}
        downwardLocations : List Location
        downwardLocations =
            stops
                |> List.foldr
                    (\stop segmentsSoFar ->
                        let
                            stopLocation =
                                { direction = Downward
                                , stationId = stop.id
                                , currentStatus = StoppedAt
                                }

                            approachingLocation =
                                { direction = Downward
                                , stationId = stop.id
                                , currentStatus = InTransitTo
                                }
                        in
                        approachingLocation :: stopLocation :: segmentsSoFar
                    )
                    []
                -- Drop the segment before the start of the line.
                |> List.drop 1

        upwardLocations : List Location
        upwardLocations =
            stops
                |> List.foldl
                    (\stop segmentsSoFar ->
                        let
                            stopLocation =
                                { direction = Upward
                                , stationId = stop.id
                                , currentStatus = StoppedAt
                                }

                            approachingLocation =
                                { direction = Upward
                                , stationId = stop.id
                                , currentStatus = InTransitTo
                                }
                        in
                        approachingLocation :: stopLocation :: segmentsSoFar
                    )
                    []
                -- Drop the segment before the start of the line.
                |> List.drop 1
                |> List.reverse

        stopNames : List (Maybe String)
        stopNames =
            stops
                |> List.map .name
                |> List.map Just
                |> List.intersperse Nothing
    in
    List.map3
        (\downLocation upLocation stopName ->
            { leftTrains =
                vehiclesAtLocation downLocation vehicles
            , rightTrains =
                vehiclesAtLocation upLocation vehicles
            , stopName = stopName
            }
        )
        downwardLocations
        upwardLocations
        stopNames


vehiclesAtLocation : Location -> List Vehicle -> List Vehicle
vehiclesAtLocation location vehicles =
    List.filter (\vehicle -> vehicleLocation vehicle == location) vehicles


vehicleLocation : Vehicle -> Location
vehicleLocation vehicle =
    { direction = vehicle.direction
    , stationId = vehicle.stationId
    , currentStatus = vehicle.currentStatus
    }
