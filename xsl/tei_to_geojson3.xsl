<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:xd="http://www.oxygenxml.com/ns/doc/xsl"
    exclude-result-prefixes="#all"
    xmlns:hcmc="http://hcmc.uvic.ca/ns"
    xmlns="http://www.tei-c.org/ns/1.0"
    xpath-default-namespace="http://www.tei-c.org/ns/1.0"
    xmlns:fn="http://www.w3.org/2005/xpath-functions"
    xmlns:xh="http://www.w3.org/1999/xhtml"
    version="3.0">
    <xd:doc scope="stylesheet">
        <xd:desc>
            <xd:p><xd:b>Created in:</xd:b> March 2018.</xd:p>
            <xd:p><xd:b>Author:</xd:b> mholmes</xd:p>
            <xd:p>The purpose of this stylesheet is to process a single 
            TEI file, conforming to a specific highly-constrained schema,
            into a single GeoJSON file. This is an XSLT 3 rewrite of the 
            original XSLT 2 version, taking advantage of the new JSON 
            features available in XSLT 3.</xd:p>
        </xd:desc>
    </xd:doc>
    
  <xsl:include href="functions_module.xsl"/>
    
  <xsl:output method="text" encoding="UTF-8" exclude-result-prefixes="#all"
    normalization-form="NFC" media-type="text/json"  />
  
  <xsl:param name="projDir" as="xs:string" select="'..'"/>
  
  <xsl:variable name="serializationParams"><output:serialization-parameters xmlns:output="http://www.w3.org/2010/xslt-xquery-serialization">
    <output:omit-xml-declaration value="yes"/>
  </output:serialization-parameters></xsl:variable>

  
    <xsl:strip-space elements="*"/>
    
    <xsl:variable name="root" select="/"/>
    <xsl:param name="outputPath" select="$projDir || '/js/' || tokenize(replace(document-uri($root), '\.xml$', ''), '/')[last()] || '.json'"/>
  
    <xsl:template match="/">
      <xsl:variable name="jsonXml">
        <map xmlns="http://www.w3.org/2005/xpath-functions">
          <string key="type">FeatureCollection</string>
          <array key="features">
            <xsl:variable name="places" select="//text/body/descendant::place[child::location]"/>
<!-- Now we do the default base feature which constitutes the map, and which is never shown.
     It includes a complete copy of the taxonomies, as well as the coordinates of the map
     starting position. -->
              <map>
                <string key="type">Feature</string>
                <string key="id">holMap</string>
<!-- Rather oddly, our data in the XML file at this point is in GeoJSON, so we have to 
     convert it to XML to insert it into this structure; later it will be converted back. -->
                <xsl:variable name="gjGeometry" as="xs:string" 
                  select="concat('{', $places[@xml:id='holMap']/location[@type='GeoJSON'][1]/geo[1], '}')"/>
                <xsl:variable name="gjGeomObj" select="json-to-xml($gjGeometry)"/>
                <xsl:sequence select="$gjGeomObj/*:map/*"/>
                <map key="properties">
                  <string key="name">holMap</string>
                  <string key="mapTitle"><xsl:value-of select="if (//titleStmt/title) then //titleStmt[1]/title[1] else ''"/></string>
<!-- This base feature gets a copy of all the taxonomies and categories. -->
                  
                  <array key="taxonomies">
                    <xsl:for-each select="$root//taxonomy">
                      <map>
                        <string key="id"><xsl:value-of select="@xml:id"/></string>
                        <string key="name"><xsl:value-of select="@n"/></string>
                        <number key="pos"><xsl:value-of select="count(preceding-sibling::taxonomy) + 1"/></number>
                        <array key="categories">
                          <xsl:for-each select="child::category">
                            <map>
                              <string key="id"><xsl:value-of select="@xml:id"/></string>
                              <string key="name"><xsl:value-of select="hcmc:createEscapedXhtml(gloss)"/></string>
                              <xsl:if test="desc">
                                <string key="desc"><xsl:value-of select="hcmc:createEscapedXhtml(desc)"/></string>
                              </xsl:if>
                              <number key="pos"><xsl:value-of select="count(preceding-sibling::category) + 1"/></number>
                            </map>
                          </xsl:for-each>
                        </array>
                      </map>
                    </xsl:for-each>
                  </array>
                  <xsl:if test="$places//location[@from-iso or @to-iso or @when-iso]">
                    <!-- NOTE: The following method of sorting/comparing datetimes is inadequate and needs to be fixed. It is present
                         as a temporary measure for development purposes. -->
                    <xsl:variable name="froms" as="xs:string*" select="sort((for $f in ($places//location/@from-iso, $places//location/@when-iso) return tokenize($f, '/')[1]))"/>
                    <xsl:variable name="tos" as="xs:string*" select="sort((for $t in ($places//location/@to-iso, $places//location/@when-iso) return tokenize($t, '/')[last()]))"/>
                    <xsl:variable name="timelinePoints" as="xs:string*" select="hcmc:getTimelinePoints($froms[1], $tos[last()], $maxTimelinePoints)"/>
                    <array key="timelinePoints">
                      <xsl:for-each select="$timelinePoints">
                        <string><xsl:sequence select="."/></string>
                      </xsl:for-each>
                    </array>
                  </xsl:if>
                </map>
              </map>
              <xsl:for-each select="$places[@xml:id != 'holMap']">
                <xsl:variable name="thisPlace" select="."/>
                <map>
                  <string key="type">Feature</string>
                  <string key="id"><xsl:value-of select="$thisPlace/@xml:id"/></string>
                  <xsl:variable name="gjGeometry" as="xs:string" 
                    select="concat('{', $thisPlace/location[@type='GeoJSON'][1]/geo[1], '}')"/>
                  <xsl:variable name="gjGeomObj" select="json-to-xml($gjGeometry)"/>
                  <xsl:sequence select="$gjGeomObj/*:map/*"/>
                  <map key="properties">
                    <string key="name"><xsl:value-of select="hcmc:createEscapedXhtml($thisPlace/placeName)"/></string>
                    <string key="desc"><xsl:value-of select="hcmc:createEscapedXhtml($thisPlace/desc[1])"/></string>
                    <array key="links">
                      <xsl:for-each select="$thisPlace/desc[2]/list/item/ptr">
                        <string><xsl:value-of select="@target"/></string>
                      </xsl:for-each>
                    </array>
                    
<!--  Now any of the dating attributes.     -->
<!--  If there's @when-iso, we turn it into from and to. -->
                    <xsl:choose>
                      <xsl:when test="$thisPlace/location/@when-iso">
                        <string key="from"><xsl:value-of select="$thisPlace/location/@when-iso"/></string>
                        <string key="to"><xsl:value-of select="$thisPlace/location/@when-iso"/></string>
                      </xsl:when>
                      <xsl:otherwise>
                        <xsl:if test="$thisPlace/location/@from-iso">
                          <string key="from"><xsl:value-of select="$thisPlace/location/@from-iso"/></string>
                        </xsl:if>
                        <xsl:if test="$thisPlace/location/@to-iso">
                          <string key="to"><xsl:value-of select="$thisPlace/location/@to-iso"/></string>
                        </xsl:if>
                      </xsl:otherwise>
                    </xsl:choose>
                    
<!--  Now taxonomies and categories.        -->
                    <xsl:variable name="thisFeatureCategories" select="for $c in distinct-values(($thisPlace/@corresp/tokenize(., '\s+'))) return substring-after($c, '#')"/>
                    <xsl:variable name="thisFeatureTaxonomies" select="$root//taxonomy[child::category[@xml:id=$thisFeatureCategories]]"/>

                    <array key="taxonomies">
                        <xsl:for-each select="$thisFeatureTaxonomies">
                          <map>
                            <string key="id"><xsl:value-of select="@xml:id"/></string>
                            <string key="name"><xsl:value-of select="@n"/></string>
                            <number key="pos"><xsl:value-of select="count(preceding-sibling::taxonomy) + 1"/></number>
                            <xsl:variable name="thisTaxCatsForThisFeat" select="child::category[@xml:id=$thisFeatureCategories]"/>
                            <array key="categories">
                              <xsl:for-each select="$thisTaxCatsForThisFeat">
                                <map>
                                  <string key="id"><xsl:value-of select="@xml:id"/></string>
                                  <string key="name"><xsl:value-of select="hcmc:createEscapedXhtml(gloss)"/></string>
                                  <xsl:if test="desc">
                                    <string key="desc"><xsl:value-of select="hcmc:createEscapedXhtml(desc)"/></string>
                                  </xsl:if>
                                  <number key="pos"><xsl:value-of select="count(preceding-sibling::category) + 1"/></number>
                                </map>
                              </xsl:for-each>
                            </array>
                          </map>
                        </xsl:for-each>
                    </array>
                  </map>
                </map>
              </xsl:for-each>
          </array>
        </map>
      </xsl:variable>
 
<!-- Uncomment this for debugging.-->

      <!--<xsl:result-document  href="{$outputPath}.xml" method="xml" indent="yes">
        <xsl:sequence select="$jsonXml"/>
      </xsl:result-document>-->
      
<!-- Output nice clean JSON without pain.     -->
      <xsl:result-document  href="{$outputPath}">
        <xsl:value-of select="xml-to-json($jsonXml, map{'indent': true()})"/>
      </xsl:result-document>
      
    </xsl:template>
  

<!-- These templates turn TEI elements into XHTML5 elements. Add more here
     to handle more complex TEI.  -->
    <xsl:template match="p" mode="xhtml5">
      <xh:div class="p"><xsl:apply-templates mode="#current"/></xh:div>
    </xsl:template>
    
    <!-- For inline elements, we need to avoid adding extra space before or after the element, so 
   the template is all on one line.-->
    <xsl:template match="title[@level='m' or @level='j'] | foreign | term" mode="xhtml5"><xh:em><xsl:apply-templates mode="#current"/></xh:em></xsl:template>
    
    <xsl:template match="title[@level='a'] | q" mode="xhtml5"><xh:q><xsl:apply-templates mode="#current"/></xh:q></xsl:template>
    
    <xsl:template match="ref[@target]" mode="xhtml5"><xh:a href="{@target}"><xsl:apply-templates mode="#current"/></xh:a></xsl:template>
    
    <xsl:template match="list" mode="xhtml5">
      <xh:ul><xsl:apply-templates mode="#current"/></xh:ul>
    </xsl:template>
    
    <xsl:template match="item" mode="xhtml5">
      <xh:li><xsl:apply-templates mode="#current"/></xh:li>
    </xsl:template>
    
    <xsl:template match="graphic" mode="xhtml5">
      <xsl:variable as="xs:string" name="imgPath"><xsl:apply-templates mode="#current" select="@url"/></xsl:variable>
      <xh:a target="_blank" href="{$imgPath}"><xh:img alt="{@url}" src="{$imgPath}"/></xh:a>
    </xsl:template>
  
    <xsl:template match="desc/descendant::gloss" mode="xhtml5">
      <xh:span class="{local-name()}"><xsl:apply-templates mode="#current"/></xh:span>
    </xsl:template>
    
    <xsl:template match="lb" mode="xhtml5">
      <xh:br/>
    </xsl:template>


    <!--
  <xsl:template match="p" mode="xhtml5">
    &lt;div class="p"&gt;<xsl:apply-templates mode="#current"/>&lt;/div&gt;
  </xsl:template>
  
<!-\- For inline elements, we need to avoid adding extra space before or after the element, so 
     the template is all on one line.-\->
  <xsl:template match="title[@level='m' or @level='j']" mode="xhtml5">&lt;em&gt;<xsl:apply-templates mode="#current"/>&lt;/em&gt;</xsl:template>
  
  <xsl:template match="title[@level='a'] | q" mode="xhtml5">&lt;q&gt;<xsl:apply-templates mode="#current"/>&lt;/q&gt;</xsl:template>
  
  <xsl:template match="ref[@target]" mode="xhtml5">&lt;a href="<xsl:value-of select="@target"/>"&gt;<xsl:apply-templates mode="#current"/>&lt;/a&gt;</xsl:template>
  
  <xsl:template match="list" mode="xhtml5">
    &lt;ul&gt;<xsl:apply-templates mode="#current"/>&lt;/ul&gt;
  </xsl:template>
  
  <xsl:template match="item" mode="xhtml5">
    &lt;li&gt;<xsl:apply-templates mode="#current"/>&lt;/li&gt;
  </xsl:template>
  
  <xsl:template match="graphic" mode="xhtml5">
    &lt;a href="<xsl:apply-templates select="@url" mode="#current"/>" target="_blank"&gt;&lt;img src="<xsl:apply-templates select="@url" mode="#current"/>" alt="<xsl:value-of select="@url"/>"/&gt;&lt;/a&gt;
  </xsl:template>
    
  <xsl:template match="lb" mode="xhtml5">
    &lt;br/&gt;
  </xsl:template>
    -->
</xsl:stylesheet>